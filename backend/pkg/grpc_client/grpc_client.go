package grpc_client

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/backoff"

	"github.com/cilium/hubble-ui/backend/pkg/dllist"
	dchannel "github.com/cilium/hubble-ui/backend/pkg/dynamic_channel"
	grpc_errors "github.com/cilium/hubble-ui/backend/pkg/grpc_utils/errors"

	"github.com/cilium/hubble-ui/backend/internal/retries"
)

const (
	SharedConnectionKey = "shared-grpc-connection"
)

type StatusSub = *dchannel.DynamicChannel[ConnectionStatus]

type GRPCClientInterface interface {
	ConnectionPropertiesProvider
	CallPropertiesProvider

	// NOTE: This method returns Droppable list item, making its clients able to
	// subscribe for connection related events
	ConnStatusChannel() *dllist.ListItem[StatusSub]
}

type ConnectionPropertiesProvider interface {
	DialOptions(context.Context) ([]grpc.DialOption, error)
	Tag(context.Context) (ConnectionTag, error)
	Validate(*ConnectionTag, *ConnectionTag) bool
}

type CallPropertiesProvider interface {
	CallOptions(context.Context) []grpc.CallOption
}

type GRPCClient struct {
	log     *slog.Logger
	retries *retries.Retries

	connProps      ConnectionPropertiesProvider
	connectionAddr string

	// NOTE: Yes, very dumb architecture with only one mutex
	mx          *sync.RWMutex
	connections ConnectionsMap
	connecting  sync.Map

	// NOTE: The data used for checking reconnction frequency
	lastReconnectAt time.Time
	attempt         int

	subs *dllist.DLList[StatusSub]
}

type ConnectionTag struct {
	Key      string
	UserData interface{}
}

func New(
	log *slog.Logger,
	addr string,
	connProps ConnectionPropertiesProvider,
	r *retries.Retries,
) (*GRPCClient, error) {
	if log == nil {
		return nil, nerr("log is nil")
	}

	if len(addr) == 0 {
		return nil, nerr("addr is empty")
	}

	if connProps == nil {
		return nil, nerr("connProps is nil")
	}

	if r == nil {
		r = defaultRetries()
	}

	return &GRPCClient{
		log:            log,
		connectionAddr: addr,
		connProps:      connProps,
		retries:        r,
		subs:           dllist.NewDLList[StatusSub](),
		mx:             new(sync.RWMutex),
		connections:    make(ConnectionsMap),
		connecting:     sync.Map{},
	}, nil
}

func (c *GRPCClient) GetStableConnection(ctx context.Context) (
	*grpc.ClientConn, error,
) {
	uc, _, err := c.ensureContext(ctx)
	if err != nil {
		return nil, err
	}

	return uc.Connection, nil
}

func (c *GRPCClient) Reconnect(ctx context.Context) (*grpc.ClientConn, error) {
	connTag, err := c.connProps.Tag(ctx)
	if err != nil {
		return nil, err
	}

	c.mx.Lock()
	_, isReconnecting := c.connecting.Load(connTag.Key)
	if isReconnecting {
		c.mx.Unlock()

		return c.GetStableConnection(ctx)
	}

	conn := c.connections[connTag.Key]
	if conn != nil {
		if err := conn.Disconnect(); err != nil {
			c.log.Warn("reconnect: old connection disconnect failed", "error", err)
		}

		delete(c.connections, connTag.Key)
		c.log.Debug("reconnect: current connection is dropped", conn.logAttrs()...)
	}
	c.mx.Unlock()

	return c.GetStableConnection(ctx)
}

func (c *GRPCClient) ConnStatusChannel() *dllist.ListItem[StatusSub] {
	dch := dchannel.New[ConnectionStatus]()
	sub := c.subs.Add(dch)

	return sub
}

func (c *GRPCClient) DialOptions(ctx context.Context) ([]grpc.DialOption, error) {
	return c.connProps.DialOptions(ctx)
}

func (c *GRPCClient) Tag(ctx context.Context) (ConnectionTag, error) {
	return c.connProps.Tag(ctx)
}

func (c *GRPCClient) Validate(l, r *ConnectionTag) bool {
	return c.connProps.Validate(l, r)
}

// NOTE: Keep this method working fully synchronously, as many synchronous user
// NOTE: methods rely on this.
func (c *GRPCClient) ensureContext(ctx context.Context) (
	*Connection, bool, error,
) {
	connTag, err := c.connProps.Tag(ctx)
	if err != nil {
		c.log.Error("connKeyFn failed", "error", err)
		return nil, false, err
	}

	connectionKey := connTag.Key
	c.log.Debug("ensureContext entered: connection key is obtained", "connectionKey", connectionKey)

	c.mx.Lock()
	conn := c.handleExistingConnection(&connTag)
	c.connecting.Store(connectionKey, struct{}{})
	defer c.connecting.Delete(connectionKey)
	isNew := false

	if conn == nil {
		c.log.Debug("about to prepare a new connection")
		// NOTE: There are cases when by some reason connection is established and
		// NOTE: immediately got into TRANSIENT_FAILURE state, so after that a new
		// NOTE: reconnect request is sent to GRPCClient. This check debounce
		// NOTE: it.
		if waitDelay, needWait := c.isReconnectingTooOften(); needWait {
			c.log.Info("Reconnects occur too often, waiting...", "delay-ms", waitDelay.Milliseconds())

			// NOTE: Well, yes, we are going to sleep while holding the lock,
			// is there any other normal action here?
			time.Sleep(waitDelay)
		}

		newConn, err := c.prepareNewConnection(ctx)
		if err != nil {
			c.mx.Unlock()
			return nil, false, err
		}

		isNew = true
		conn = newConn
		c.connections[connectionKey] = conn
		c.log.Debug("new connection is prepared and stored", newConn.logAttrs()...)
	} else {
		c.log.Debug("reusing existing connection", conn.logAttrs()...)
	}

	c.mx.Unlock()

	for err := c.establishConnection(ctx, conn); err != nil; {
		c.log.Debug("establishConnection failed",
			"error", err,
			"is_unavailable", grpc_errors.IsUnavailable(err),
			"is_recoverable", grpc_errors.IsRecoverable(err))

		if !grpc_errors.IsConnClosing(err) {
			return nil, isNew, err
		}

		c.log.Debug("connection gives ErrClientConnClosing, dropping connection", "error", err)

		err = c.dropConnection(conn)
		c.log.Warn("old connection drop result", "error", err)

		conn, err = c.prepareNewConnection(ctx)
		if err != nil {
			return nil, isNew, err
		}
	}

	c.log.Debug("ensureContext is finished", conn.logAttrs()...)

	return conn, isNew, nil
}

func (c *GRPCClient) handleExistingConnection(tag *ConnectionTag) *Connection {
	existing := c.connections[tag.Key]
	if existing == nil {
		return nil
	}

	isStillValid := c.connProps.Validate(&existing.Tag, tag)
	if isStillValid {
		return existing
	}

	c.log.Debug("dropping existing connection because its no longer valid", existing.logAttrs()...)

	err := existing.Disconnect()
	if err != nil {
		c.log.Warn("failed to close previous connection", append(existing.logAttrs(), "error", err)...)
	}

	delete(c.connections, tag.Key)
	return nil
}

func (c *GRPCClient) prepareNewConnection(ctx context.Context) (*Connection, error) {
	dialOpts, err := c.getDialOptions(ctx)
	if err != nil {
		c.log.Error("prepareNewConnection: failed to get dial options", "error", err)
		return nil, err
	}

	connectionTag, err := c.connProps.Tag(ctx)
	if err != nil {
		c.log.Error("prepareNewConnection: failed to get connection key", "error", err)
		return nil, err
	}

	c.log.Info("preparing new user connection", "addr", c.connectionAddr, "nopts", len(dialOpts))

	userConnection := initConection(
		connectionTag,
		c.connectionAddr,
		dialOpts,
	)

	return userConnection, nil
}

func (c *GRPCClient) establishConnection(
	ctx context.Context,
	conn *Connection,
) error {
	conn.lock()
	defer conn.unlock()

	logAttrs := conn.logAttrs()
	c.log.Debug("about to establish the connection", logAttrs...)

	firstConnection := conn.Connection == nil
	if conn.isReady() || !firstConnection {
		c.log.Debug("no establishing required: connection is ready or pending", logAttrs...)

		c.emitConnected()
		return nil
	}

	if err := conn.connect(ctx); err != nil {
		c.log.Error("failed to grpc.Dial, going to reconnect", append(logAttrs, "error", err)...)
	} else {
		c.log.Debug("connection established", logAttrs...)
		c.emitConnected()
		return nil
	}

	retryHandle := c.retries.Clone()

	// NOTE: It is important to return if ErrClientConnClosing is encountered
	err := retryHandle.RetryIf(
		ctx,
		func(attempt int) error {
			logAttrsWithAttempt := append(logAttrs, "attempt", attempt)

			if !firstConnection || attempt > 1 {
				c.log.Info("connection establishing attempt", logAttrsWithAttempt...)
			}

			c.log.Debug("emit connecting attempt", logAttrsWithAttempt...)
			c.emitConnectingAttempt(attempt)

			c.log.Debug("right before conn.connect()", logAttrsWithAttempt...)
			if err := conn.connect(ctx); err != nil {
				c.log.Error("connection establishing attempt failed", append(logAttrsWithAttempt, "error", err)...)
				return err
			}
			c.log.Debug("right after conn.connect()", logAttrsWithAttempt...)

			if !firstConnection || attempt > 1 {
				c.log.Info("connection established", logAttrsWithAttempt...)
			}

			c.emitConnected()
			return nil
		},
		func(err error) bool {
			return grpc_errors.IsUnavailable(err) ||
				errors.Is(err, context.DeadlineExceeded)
		},
	)

	return err
}

func (c *GRPCClient) dropConnection(conn *Connection) error {
	if conn == nil {
		return nil
	}

	delete(c.connections, conn.Tag.Key)
	return conn.Disconnect()
}

func (c *GRPCClient) isReconnectingTooOften() (time.Duration, bool) {
	if c.lastReconnectAt.IsZero() {
		c.lastReconnectAt = time.Now()
		c.attempt = 1
		return 0, false
	}

	diff := time.Since(c.lastReconnectAt)
	currentDelay := c.retries.Duration(c.attempt)

	var leftToWait time.Duration
	if diff < currentDelay {
		leftToWait = currentDelay - diff
	} else {
		leftToWait = 0
	}

	c.log.Debug("since last reconnect request",
		"diff", diff,
		"currentDelay", currentDelay,
		"leftToWait", leftToWait,
		"retries.Max()", c.retries.Max())

	switch {
	case leftToWait > 0:
		return leftToWait, true
	case diff >= c.retries.Max():
		c.attempt = 0
		c.lastReconnectAt = time.Time{}
		return 0, false
	default:
		c.attempt += 1
		nextDelay := c.retries.Duration(c.attempt)
		c.lastReconnectAt = time.Now().Add(nextDelay)
		return nextDelay, true
	}
}

func (c *GRPCClient) getDialOptions(ctx context.Context) ([]grpc.DialOption, error) {
	return c.connProps.DialOptions(ctx)
}

func defaultRetries() *retries.Retries {
	return retries.NewFromGRPC(&backoff.Config{
		BaseDelay:  1.0 * time.Second,
		Multiplier: 1.6,
		Jitter:     0.2,
		MaxDelay:   7 * time.Second,
	})
}

func nerr(reason string) error {
	return fmt.Errorf("failed to create GRPCClient: %s", reason)
}
