package flow_stream

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sync"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/cilium/api/v1/observer"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"

	"github.com/cilium/hubble-ui/backend/domain/labels"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/pkg/grpc_client"
	grpc_errors "github.com/cilium/hubble-ui/backend/pkg/grpc_utils/errors"

	"github.com/cilium/hubble-ui/backend/internal/msg"
)

const (
	MaxNumOfEOF        = 3
	NumEOFForReconnect = 2
)

type StreamFn = func(context.Context, int) (
	observer.Observer_GetFlowsClient,
	error,
)

type FlowStreamInterface interface {
	Run(ctx context.Context, req *observer.GetFlowsRequest)
	Stop()

	CollectLimit(context.Context, *observer.GetFlowsRequest, int64) ([]*pbFlow.Flow, error)

	Flows() chan *pbFlow.Flow
	Errors() chan error
	Stopped() chan struct{}
}

type FlowStream struct {
	log logrus.FieldLogger

	connectionPool  grpc_client.ConnectionPool
	callProps       grpc_client.CallPropertiesProvider
	connectionMutex *sync.Mutex

	connection *grpc.ClientConn
	flowStream observer.Observer_GetFlowsClient
	req        *observer.GetFlowsRequest

	flows    chan *pbFlow.Flow
	errors   chan error
	stop     chan struct{}
	stopOnce sync.Once
}

func New(
	log logrus.FieldLogger,
	connPool grpc_client.ConnectionPool,
	callProps grpc_client.CallPropertiesProvider,
) (*FlowStream, error) {
	if log == nil {
		return nil, nerr("log is nil")
	}

	if connPool == nil {
		return nil, nerr("connPool is nil")
	}

	if callProps == nil {
		return nil, nerr("callProps is nil")
	}

	return &FlowStream{
		log:             log,
		connectionPool:  connPool,
		callProps:       callProps,
		stop:            make(chan struct{}),
		stopOnce:        sync.Once{},
		connectionMutex: new(sync.Mutex),
	}, nil
}

func NewDumb() *FlowStream {
	return new(FlowStream)
}

func (h *FlowStream) CollectLimit(
	ctx context.Context,
	req *observer.GetFlowsRequest,
	limit int64,
) ([]*pbFlow.Flow, error) {
	go h.Run(ctx, req)
	defer h.Stop()

	flows := make([]*pbFlow.Flow, 0)
	for {
		select {
		case <-ctx.Done():
			return flows, ctx.Err()
		case err := <-h.Errors():
			return nil, err
		case f := <-h.Flows():
			if f == nil {
				continue
			}

			if limit != -1 && int64(len(flows)) >= limit {
				return flows, nil
			}

			flows = append(flows, f)
		case <-h.Stopped():
			h.log.
				WithField("nflows", len(flows)).
				Debug("CollectLimit is finished")

			return flows, ctx.Err()
		}
	}
}

func (h *FlowStream) runLoop(
	ctx context.Context,
	iterFn func(observer.Observer_GetFlowsClient) error,
) {
	isEOFFatal := false
	tryEOFReconnect := false
	numTransientErrors := 0
	isDatumFetched := false

F:
	for {
		if h.shouldStop(ctx) {
			break
		}

		isRenewed, err := h.ensureConnection(ctx)
		if err != nil {
			h.log.WithError(err).Error("ensureConnection failed")
			h.sendError(ctx, err)
			return
		}

		if isRenewed {
			isEOFFatal = false
			tryEOFReconnect = false
			numTransientErrors = 0
			isDatumFetched = false

			h.log.Debug("connection is renewed")
		}

		if h.flowStream == nil {
			h.log.Debug("recreating flow stream")
			err := h.recreateFlowStream(ctx)

			if err != nil {
				h.log.
					WithError(err).
					WithField("connection-addr", fmt.Sprintf("%p", h.connection)).
					Warn("recreateFlowStream failed")

				if grpc_errors.IsRecoverable(err) {
					h.log.Debug("error is recoverable, running reconnect()")
					if err := h.reconnect(ctx); err != nil {
						h.log.WithError(err).Debug("reconnect failed, exiting")
						h.sendError(ctx, err)
						break F
					}

					continue F
				} else {
					h.log.Debug("error is not recoverable, exiting")
					h.sendError(ctx, err)
					break F
				}
			}

			h.log.Debug("recreateFlowStream finished")
		}

		select {
		case <-ctx.Done():
			return
		case <-h.stop:
			return
		default:
			err := iterFn(h.flowStream)

			// NOTE: Once we get proper response, we reset all error flags and counters
			if err == nil {
				isEOFFatal = false
				tryEOFReconnect = false
				numTransientErrors = 0
				isDatumFetched = true
				continue F
			}

			if errors.Is(err, context.Canceled) || grpc_errors.IsCancelled(err) {
				break F
			}

			log := h.log.WithError(err).
				WithField("MaxNumOfEOF", MaxNumOfEOF).
				WithField("nEOFS", numTransientErrors)

			if errors.Is(err, io.EOF) {
				if isDatumFetched {
					log.Info("EOF occurred after datum is fetched. Stream ends.")
					return
				}

				numTransientErrors += 1
				tryEOFReconnect = tryEOFReconnect || numTransientErrors == NumEOFForReconnect
				isEOFFatal = isEOFFatal || numTransientErrors >= MaxNumOfEOF
				log = log.
					WithField("EOFReconnect", tryEOFReconnect).
					WithField("MaxEOFReached", isEOFFatal)

				switch {
				case isEOFFatal:
					log.Warn(
						"EOF occurred after reconnect. Timescape has no data.",
					)

					return
				case tryEOFReconnect:
					tryEOFReconnect = false
					log.Warn("EOF occurred several times, trying reconnect")

					if err := h.reconnect(ctx); err != nil {
						h.sendError(ctx, err)
						return
					}

					continue F
				default:
					continue F
				}
			} else {
				log.Warn("fetching Flow from underlying flow stream failed")
			}

			if grpc_errors.IsRecoverable(err) {
				if err := h.reconnect(ctx); err != nil {
					h.sendError(ctx, err)
					break F
				}
				continue F
			}

			h.sendError(ctx, err)
			break F
		}
	}
}

func (h *FlowStream) Run(ctx context.Context, req *observer.GetFlowsRequest) {
	h.req = req
	h.log.
		WithField("FlowStream", fmt.Sprintf("%p", h)).
		Debug("running")

	h.runLoop(ctx, func(flowStream observer.Observer_GetFlowsClient) error {
		getFlowResponse, err := flowStream.Recv()
		if err != nil {
			return err
		}

		f := getFlowResponse.GetFlow()
		if f == nil {
			return nil
		}

		h.handleFlow(ctx, f)
		return nil
	})

	h.Stop()
}

func (h *FlowStream) Stop() {
	h.stopOnce.Do(func() {
		if h.stop != nil {
			close(h.stop)
		}
	})

	h.log.
		WithField("FlowStream", fmt.Sprintf("%p", h)).
		Info("FlowStream has been stopped")
}

func (h *FlowStream) Stopped() chan struct{} {
	return h.stop
}

func (h *FlowStream) Errors() chan error {
	if h.errors == nil {
		h.errors = make(chan error)
	}

	return h.errors
}

func (h *FlowStream) Flows() chan *pbFlow.Flow {
	if h.flows == nil {
		h.flows = make(chan *pbFlow.Flow)
	}

	return h.flows
}

func (h *FlowStream) ensureConnection(ctx context.Context) (bool, error) {
	if h.connection != nil {
		return false, nil
	}

	conn, err := h.connectionPool.GetStableConnection(ctx)
	if err != nil {
		return false, err
	}

	h.connection = conn
	h.flowStream = nil
	return true, nil
}

func (h *FlowStream) reconnect(ctx context.Context) error {
	h.connection = nil
	h.flowStream = nil

	conn, err := h.connectionPool.Reconnect(ctx)
	if err != nil {
		return err
	}

	h.connection = conn
	return nil
}

func (h *FlowStream) recreateFlowStream(ctx context.Context) error {
	observerClient := observer.NewObserverClient(h.connection)

	stream, err := observerClient.GetFlows(ctx, h.req, h.callProps.CallOptions(ctx)...)
	if err != nil {
		return err
	}

	h.flowStream = stream
	return nil
}

func (h *FlowStream) handleFlow(ctx context.Context, f *pbFlow.Flow) {
	if f.GetL4() == nil || f.GetSource() == nil || f.GetDestination() == nil {
		return
	}
	sourceId, destId := service.IdsFromFlowProto(f)
	if sourceId == "0" || destId == "0" {
		h.log.Warnf(msg.ZeroIdentityInSourceOrDest)
		h.printZeroIdentityFlow(f)
		return
	}

	// TODO: workaround to hide flows/services which are showing as "World",
	// but actually they are k8s services without initialized pods.
	// Appropriate fix is to construct and show special service map cards
	// and show these flows in special way inside flows table.
	if f.GetDestination() != nil {
		destService := f.GetDestinationService()
		destLabelsProps := labels.Props(f.GetDestination().GetLabels())
		destNames := f.GetDestinationNames()
		isDestOutside := destLabelsProps.IsWorld || len(destNames) > 0

		if destService != nil && isDestOutside {
			return
		}
	}

	h.sendFlow(ctx, f)
}

func (h *FlowStream) sendFlow(ctx context.Context, f *pbFlow.Flow) {
	select {
	case <-ctx.Done():
	case <-h.stop:
	case h.Flows() <- f:
	}
}

func (h *FlowStream) sendError(ctx context.Context, err error) {
	select {
	case <-ctx.Done():
	case <-h.stop:
	case h.errors <- err:
	}
}

func (h *FlowStream) shouldStop(ctx context.Context) bool {
	select {
	case <-ctx.Done():
		return true
	default:
		if h.stop == nil {
			return true
		}

		select {
		case <-ctx.Done():
			return true
		case <-h.stop:
			return true
		default:
		}
	}

	return false
}

func (h *FlowStream) printZeroIdentityFlow(f *pbFlow.Flow) {
	serialized, err := json.Marshal(f)
	if err != nil {
		h.log.Errorf("failed to marshal flow to json: %v\n", err)
		return
	}

	h.log.WithField("json", string(serialized)).Warn("zero identity flow")
}
