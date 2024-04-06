package streams

import (
	"context"
	"errors"
	"sync"

	"github.com/sirupsen/logrus"

	pbflow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/cilium/api/v1/observer"
	v1 "github.com/cilium/cilium/pkg/hubble/api/v1"
	"github.com/cilium/cilium/pkg/hubble/filters"

	"github.com/cilium/hubble-ui/backend/internal/mock/sources"
	"github.com/cilium/hubble-ui/backend/pkg/rate_limiter"
)

type FlowStream struct {
	log logrus.FieldLogger
	src sources.MockedSource
	rl  rate_limiter.RateLimit

	flowsCh chan *pbflow.Flow
	errCh   chan error

	stopOnce sync.Once
	stopCh   chan struct{}
}

func NewFlowStream(
	log logrus.FieldLogger,
	src sources.MockedSource,
	rl rate_limiter.RateLimit,
) *FlowStream {
	return &FlowStream{
		log:      log,
		src:      src,
		rl:       rl,
		stopOnce: sync.Once{},
		flowsCh:  make(chan *pbflow.Flow),
		errCh:    make(chan error),
		stopCh:   make(chan struct{}),
	}
}

func (fs *FlowStream) Run(ctx context.Context, req *observer.GetFlowsRequest) {
	fs.log.Info("running")
	defer fs.log.Info("run finished")

	if fs.src == nil {
		return
	}

	whitelist, err := filters.BuildFilterList(
		ctx,
		req.GetWhitelist(),
		filters.DefaultFilters,
	)

	if err != nil {
		fs.log.WithError(err).Error("failed to build whitelist hubble filters")
		fs.sendError(ctx, err)
		return
	}

	blacklist, err := filters.BuildFilterList(
		ctx,
		req.GetBlacklist(),
		filters.DefaultFilters,
	)

	if err != nil {
		fs.log.WithError(err).Error("failed to build blacklist hubble filters")
		fs.sendError(ctx, err)
		return
	}

	rl := rate_limiter.New(fs.rl)

	go fs.src.Run(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-fs.src.Stopped():
			return
		case <-fs.stopCh:
			return
		case f := <-fs.src.Flows():
			evt := &v1.Event{
				Timestamp: f.GetTime(),
				Event:     f,
			}

			isAllowed := filters.Apply(whitelist, blacklist, evt)
			if !isAllowed {
				break
			}

			if err := rl.Wait(ctx); err != nil && !errors.Is(err, context.Canceled) {
				fs.sendError(ctx, err)
				return
			}

			fs.sendFlow(ctx, f)
		}
	}
}

func (fs *FlowStream) Stop() {
	fs.log.Info("stop is called")

	fs.stopOnce.Do(func() {
		fs.log.Info("closing stop channel")
		close(fs.stopCh)
	})
}

func (fs *FlowStream) CollectLimit(ctx context.Context, req *observer.GetFlowsRequest, lim int64) (
	[]*pbflow.Flow, error,
) {
	return []*pbflow.Flow{}, nil
}

func (fs *FlowStream) Flows() chan *pbflow.Flow {
	return fs.flowsCh
}

func (fs *FlowStream) Errors() chan error {
	return fs.errCh
}

func (fs *FlowStream) Stopped() chan struct{} {
	return fs.stopCh
}

func (fs *FlowStream) sendFlow(ctx context.Context, f *pbflow.Flow) {
	if f == nil {
		return
	}

	select {
	case <-ctx.Done():
	case <-fs.stopCh:
	case fs.flowsCh <- f:
	}
}

func (fs *FlowStream) sendError(ctx context.Context, err error) {
	if err == nil {
		return
	}

	select {
	case <-ctx.Done():
	case <-fs.stopCh:
	case fs.errCh <- err:
	}
}
