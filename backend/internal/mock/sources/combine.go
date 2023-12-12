package sources

import (
	"context"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
)

type CombinedSource struct {
	emptySource
	srcs []MockedSource

	namespacesCh NSEventChannel
	flowsCh      FlowsChannel
}

func Combine(srcs ...MockedSource) *CombinedSource {
	return &CombinedSource{
		emptySource:  newEmpty(),
		srcs:         srcs,
		namespacesCh: make(NSEventChannel),
		flowsCh:      make(FlowsChannel),
	}
}

func (cs *CombinedSource) Run(ctx context.Context) {
	for _, src := range cs.srcs {
		go cs.runSource(ctx, src)
	}
}

func (cs *CombinedSource) Stop() {
	for _, src := range cs.srcs {
		src.Stop()
	}

	cs.emptySource.Stop()
}

func (cs *CombinedSource) Duplicate() MockedSource {
	clonedSources := make([]MockedSource, len(cs.srcs))

	for idx, src := range cs.srcs {
		clonedSources[idx] = src.Duplicate()
	}

	return Combine(clonedSources...)
}

func (cs *CombinedSource) Namespaces() NSEventChannel {
	return cs.namespacesCh
}

func (cs *CombinedSource) Flows() FlowsChannel {
	return cs.flowsCh
}

func (cs *CombinedSource) runSource(ctx context.Context, src MockedSource) {
	go src.Run(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-src.Stopped():
			return
		case <-cs.Stopped():
			return
		case nsEvt := <-src.Namespaces():
			cs.sendNamespace(ctx, nsEvt)
		case flowEvt := <-src.Flows():
			cs.sendFlow(ctx, flowEvt)
		}
	}
}

func (cs *CombinedSource) sendNamespace(ctx context.Context, e *common.NSEvent) {
	select {
	case <-ctx.Done():
	case <-cs.Stopped():
	case cs.namespacesCh <- e:
	}
}

func (cs *CombinedSource) sendFlow(ctx context.Context, e *pbFlow.Flow) {
	select {
	case <-ctx.Done():
	case <-cs.Stopped():
	case cs.flowsCh <- e:
	}
}
