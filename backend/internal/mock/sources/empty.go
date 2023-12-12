package sources

import (
	"context"
	"sync"
)

type emptySource struct {
	stopCh   chan struct{}
	stopOnce sync.Once
}

func newEmpty() emptySource {
	return emptySource{
		stopCh:   make(chan struct{}),
		stopOnce: sync.Once{},
	}
}

func (es *emptySource) Namespaces() NSEventChannel {
	return make(NSEventChannel)
}

func (es *emptySource) Flows() FlowsChannel {
	return make(FlowsChannel)
}

func (es *emptySource) Run(ctx context.Context) {}

func (es *emptySource) Stop() {
	es.stopOnce.Do(func() {
		close(es.stopCh)
	})
}

func (es *emptySource) Stopped() chan struct{} {
	return es.stopCh
}

func (es *emptySource) Duplicate() MockedSource {
	panic("you have to implement Duplicate() method on your source")
}
