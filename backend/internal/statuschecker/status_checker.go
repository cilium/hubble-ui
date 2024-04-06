package statuschecker

import (
	"context"
	"errors"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"

	"github.com/cilium/hubble-ui/backend/pkg/grpc_client"
	grpc_errors "github.com/cilium/hubble-ui/backend/pkg/grpc_utils/errors"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
)

type NewClientFn = func(context.Context, int) (observer.ObserverClient, error)

type ServerStatusCheckerInterface interface {
	Run(context.Context)
	Stop()

	Errors() chan error
	Statuses() chan *FullStatus
}

type Handle struct {
	log            logrus.FieldLogger
	delay          time.Duration
	connectionPool grpc_client.ConnectionPool
	callProps      grpc_client.CallPropertiesProvider

	conn            *grpc.ClientConn
	connectionMutex *sync.Mutex
	observerClient  observer.ObserverClient

	errors   chan error
	statuses chan *FullStatus
	stop     chan struct{}
	stopOnce sync.Once
	isDumb   bool
}

func New(
	log logrus.FieldLogger,
	delay time.Duration,
	connPool grpc_client.ConnectionPool,
	callProps grpc_client.CallPropertiesProvider,
) (*Handle, error) {
	if log == nil {
		return nil, nerr("log is nil")
	}

	if connPool == nil {
		return nil, nerr("connPool is nil")
	}

	if callProps == nil {
		return nil, nerr("callProps is nil")
	}

	if delay == 0 {
		delay = 3 * time.Second
	}

	return &Handle{
		log:             log,
		connectionPool:  connPool,
		callProps:       callProps,
		delay:           delay,
		connectionMutex: new(sync.Mutex),
		stop:            make(chan struct{}),
		stopOnce:        sync.Once{},
		isDumb:          false,
	}, nil
}

func NewDumb() *Handle {
	h := new(Handle)
	h.isDumb = true
	h.log = logger.Sub("dumb-status-checker")
	h.stopOnce = sync.Once{}
	h.delay = 3 * time.Second

	return h
}

func (h *Handle) Run(ctx context.Context) {
	if h.isDumb {
		return
	}

	ticker := time.NewTicker(h.delay)
	defer ticker.Stop()

	h.log.
		WithField("StatusChecker", fmt.Sprintf("%p", h)).
		Infof("running data fetch loop")

	h.runLoop(ctx, ticker, func(cl observer.ObserverClient) error {
		ss, err := cl.ServerStatus(ctx, &observer.ServerStatusRequest{}, h.callProps.CallOptions(ctx)...)
		if err != nil {
			return err
		}

		hn, err := cl.GetNodes(ctx, &observer.GetNodesRequest{}, h.callProps.CallOptions(ctx)...)
		if err != nil {
			return err
		}

		h.sendStatus(ctx, ss, hn)
		return ctx.Err()
	})

	h.Stop()
	h.log.Debug("runLoop terminated")
}

func (h *Handle) Stop() {
	h.stopOnce.Do(func() {
		if h.stop != nil {
			close(h.stop)
		}
	})

	h.log.
		WithField("StatusChecker", fmt.Sprintf("%p", h)).
		Debug("Stop() is called")
}

func (h *Handle) Errors() chan error {
	if h.errors == nil {
		h.errors = make(chan error)
	}

	return h.errors
}

func (h *Handle) Statuses() chan *FullStatus {
	if h.statuses == nil {
		h.statuses = make(chan *FullStatus)
	}

	return h.statuses
}

func (h *Handle) runLoop(
	ctx context.Context,
	ticker *time.Ticker,
	iterFn func(observer.ObserverClient) error,
) {
	isEOFFatal := false
	numTransientErrors := 0
	lastCheck := time.Now()

	onTick := func(immediateMode bool) error {
		if !immediateMode && time.Since(lastCheck) < h.delay {
			return nil
		}

		lastCheck = time.Now()
		err := iterFn(h.observerClient)

		// NOTE: Once we get proper status from server any err becomes fatal
		if err == nil {
			isEOFFatal = true
			return nil
		}

		if errors.Is(err, io.EOF) {
			numTransientErrors += 1
			isEOFFatal = isEOFFatal || numTransientErrors >= 3
		}

		if errors.Is(err, context.Canceled) {
			return err
		}

		if isEOFFatal || grpc_errors.IsRecoverable(err) {
			if err := h.reconnect(ctx); err != nil {
				h.sendError(ctx, err)
				return err
			}

			return nil
		}

		h.sendError(ctx, err)
		return err
	}

	for {
		if h.shouldStop(ctx) {
			break
		}

		isRenewed, err := h.ensureConnection(ctx)
		if err != nil {
			h.sendError(ctx, err)
			return
		}

		if isRenewed {
			isEOFFatal = false
			continue
		}

		if err := onTick(true); err != nil {
			h.log.WithError(err).Error("first tick failed")
			return
		}

		select {
		case <-ctx.Done():
			return
		case <-h.stop:
			return
		case <-ticker.C:
			if err := onTick(false); err != nil {
				h.log.WithError(err).Error("onTick failed")
				return
			}
		}
	}
}

func (h *Handle) ensureConnection(ctx context.Context) (bool, error) {
	if h.conn != nil {
		return false, nil
	}

	conn, err := h.connectionPool.GetStableConnection(ctx)
	if err != nil {
		return false, err
	}

	h.conn = conn
	h.observerClient = observer.NewObserverClient(h.conn)
	return true, nil
}

func (h *Handle) reconnect(ctx context.Context) error {
	h.conn = nil
	h.observerClient = nil

	conn, err := h.connectionPool.Reconnect(ctx)
	if err != nil {
		return err
	}

	h.conn = conn
	h.observerClient = observer.NewObserverClient(conn)
	return nil
}

func (h *Handle) sendStatus(
	ctx context.Context,
	ss *observer.ServerStatusResponse,
	hn *observer.GetNodesResponse,
) {
	resp := &FullStatus{
		Nodes:  hn,
		Status: ss,
	}

	select {
	case <-ctx.Done():
	case <-h.stop:
	case h.Statuses() <- resp:
	}
}

func (h *Handle) sendError(ctx context.Context, err error) {
	select {
	case <-ctx.Done():
	case <-h.stop:
	case h.Errors() <- err:
	}
}

func (h *Handle) shouldStop(ctx context.Context) bool {
	select {
	case <-ctx.Done():
		return true
	case <-h.stop:
		return true
	default:
		return false
	}
}

func nerr(reason string) error {
	return fmt.Errorf("failed to create StatusChecker: %s", reason)
}
