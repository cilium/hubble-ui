package streams

import (
	"context"
	"sync"

	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/mock/sources"
	ns_common "github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
)

type NSWatcher struct {
	log    logrus.FieldLogger
	source sources.MockedSource

	stopOnce sync.Once
	stopCh   chan struct{}

	eventsCh chan *ns_common.NSEvent
	errCh    chan error
}

func NewNSWatcher(log logrus.FieldLogger, source sources.MockedSource) *NSWatcher {
	return &NSWatcher{
		log:      log,
		source:   source,
		stopOnce: sync.Once{},
		stopCh:   make(chan struct{}),
		eventsCh: make(chan *ns_common.NSEvent),
		errCh:    make(chan error),
	}
}

func (nsw *NSWatcher) Run(ctx context.Context) {
	if nsw.source == nil {
		nsw.log.Warn("source is not set, returning")
		return
	}

	nsw.log.Info("running")
	go nsw.source.Run(ctx)

	for {
		select {
		case <-ctx.Done():
			nsw.log.Info("context done")
			return
		case <-nsw.stopCh:
			nsw.log.Info("watcher is stopped")
			return
		case nse := <-nsw.source.Namespaces():
			select {
			case <-ctx.Done():
			case <-nsw.stopCh:
			case nsw.eventsCh <- nse:
			}
		}
	}
}

func (nsw *NSWatcher) Stop() {
	nsw.log.Info("stop is called")

	nsw.stopOnce.Do(func() {
		nsw.log.Info("closing stop channel")
		close(nsw.stopCh)
	})
}

func (nsw *NSWatcher) NSEvents() chan *ns_common.NSEvent {
	return nsw.eventsCh
}

func (nsw *NSWatcher) Errors() chan error {
	return nsw.errCh
}
