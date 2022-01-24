package statuschecker

import (
	"context"
	"sync"
	"time"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/sirupsen/logrus"

	grpc_errors "github.com/cilium/hubble-ui/backend/internal/grpc/errors"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/internal/retries"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
)

type NewClientFn = func(context.Context, int) (observer.ObserverClient, error)

type Handle struct {
	newClientFn    NewClientFn
	observerClient observer.ObserverClient
	log            *logrus.Entry
	delay          time.Duration

	statuses     chan *observer.ServerStatusResponse
	errors       chan error
	reconnecting chan struct{}
	stop         chan struct{}
	stopOnce     sync.Once
}

func New() builder {
	return builder{}
}

func NewDumb() *Handle {
	h := new(Handle)
	h.log = logger.Sub("dumb-status-checker")
	h.stopOnce = sync.Once{}
	h.delay = 3 * time.Second

	return h
}

func (h *Handle) Run(ctx context.Context) {
	connFn := func(attempt int) error {
		if attempt > 1 {
			h.emitReconnecting(ctx)
		}

		observerClient, err := h.newClientFn(ctx, attempt)
		if err != nil {
			return err
		}

		h.observerClient = observerClient
		return nil
	}

	ticker := time.NewTicker(h.delay)
	defer ticker.Stop()
	lastCheck := time.Now()

F:
	for {
		if h.shouldStop(ctx) {
			break
		}

		if h.observerClient == nil {
			retryHandle := retries.New()
			cancelled, err := retryHandle.RetryIfGrpcUnavailable(ctx, connFn)
			if cancelled {
				break
			}

			if err != nil {
				h.sendError(ctx, err)
				break
			}
		}

		select {
		case <-ctx.Done():
			break F
		case <-h.stop:
			break F
		case <-ticker.C:
			if time.Since(lastCheck) < h.delay {
				continue F
			}

			ss, err := h.observerClient.ServerStatus(
				ctx,
				&observer.ServerStatusRequest{},
			)

			if err != nil {
				h.handleError(ctx, err)
				continue F
			}

			h.sendStatus(ctx, ss)
			lastCheck = time.Now()
		}

	}

	h.log.Infof(msg.HubbleStatusCheckerIsStopped)
}

func (h *Handle) Stop() {
	h.stopOnce.Do(func() {
		if h.stop != nil {
			close(h.stop)
		}
	})

	h.log.Debugf("Hubble Status Checker handle is stopped\n")
}

func (h *Handle) Errors() chan error {
	if h.errors == nil {
		h.errors = make(chan error)
	}

	return h.errors
}

func (h *Handle) Statuses() chan *observer.ServerStatusResponse {
	if h.statuses == nil {
		h.statuses = make(chan *observer.ServerStatusResponse)
	}

	return h.statuses
}

func (h *Handle) Reconnecting() chan struct{} {
	if h.reconnecting == nil {
		h.reconnecting = make(chan struct{}, 1)
	}

	return h.reconnecting
}

func (h *Handle) sendStatus(ctx context.Context, ss *observer.ServerStatusResponse) {
	select {
	case <-ctx.Done():
	case <-h.stop:
	case h.Statuses() <- ss:
	}
}

func (h *Handle) handleError(ctx context.Context, err error) {
	if grpc_errors.IsUnavailable(err) {
		h.observerClient = nil
		return
	}

	h.sendError(ctx, err)
}

func (h *Handle) sendError(ctx context.Context, err error) {
	select {
	case <-ctx.Done():
	case <-h.stop:
	case h.Errors() <- err:
	}
}

func (h *Handle) emitReconnecting(ctx context.Context) {
	if h.reconnecting == nil {
		return
	}

	select {
	case <-ctx.Done():
	case <-h.stop:
	case h.reconnecting <- struct{}{}:
	default:
	}
}

func (h *Handle) shouldStop(ctx context.Context) bool {
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
