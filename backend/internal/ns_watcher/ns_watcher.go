package ns_watcher

import (
	"context"
	"fmt"
	"sync"

	"github.com/sirupsen/logrus"
	"k8s.io/client-go/kubernetes"

	"github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
	"github.com/cilium/hubble-ui/backend/internal/ns_watcher/k8s"
)

const (
	NSWatcherK8sKind int = iota
)

type NSEvent = common.NSEvent

type NSWatcherOptions struct {
	Log logrus.FieldLogger
}

type NSWatcherInterface interface {
	Run(context.Context)
	Stop()

	NSEvents() chan *common.NSEvent
	Errors() chan error
}

type NSWatcher struct {
	k8sWatcher *k8s.Watcher
	log        logrus.FieldLogger

	errors chan error
	events chan *common.NSEvent

	stop     chan struct{}
	stopOnce sync.Once
}

func New(
	log logrus.FieldLogger,
	k8sHandle kubernetes.Interface,
) (*NSWatcher, error) {
	if log == nil {
		return nil, nerr("log is nil")
	}

	if k8sHandle == nil {
		return nil, nerr("k8s is nil")
	}

	return &NSWatcher{
		log:        log,
		k8sWatcher: k8s.New(log.WithField("ns-kind", "k8s"), k8sHandle),
		stop:       make(chan struct{}),
		stopOnce:   sync.Once{},
	}, nil
}

func NewDumb() *NSWatcher {
	return new(NSWatcher)
}

func (w *NSWatcher) Run(ctx context.Context) {
	w.runK8sWatcher(ctx)
}

func (w *NSWatcher) Stop() {
	if w.k8sWatcher != nil {
		w.k8sWatcher.Stop()
	}

	w.stopOnce.Do(func() {
		if w.stop == nil {
			return
		}

		close(w.stop)
	})
}

func (w *NSWatcher) NSEvents() chan *common.NSEvent {
	if w.events == nil {
		w.events = make(chan *common.NSEvent)
	}

	return w.events
}

func (w *NSWatcher) Errors() chan error {
	if w.errors == nil {
		w.errors = make(chan error)
	}

	return w.errors
}

func (w *NSWatcher) runK8sWatcher(ctx context.Context) {
	go w.k8sWatcher.Run(ctx)

F:
	for {
		select {
		case <-ctx.Done():
			break F
		case <-w.stop:
			break F
		case evt := <-w.k8sWatcher.NSEvents():
			w.sendEvent(NSWatcherK8sKind, ctx, evt)
		case err := <-w.k8sWatcher.Errors():
			w.sendError(ctx, err)
		}
	}
}

func (w *NSWatcher) sendError(ctx context.Context, err error) {
	select {
	case <-ctx.Done():
	case <-w.stop:
	case w.Errors() <- err:
	}
}

func (w *NSWatcher) sendEvent(_kind int, ctx context.Context, nse *common.NSEvent) {
	select {
	case <-ctx.Done():
	case <-w.stop:
	case w.NSEvents() <- nse:
	}
}

func nerr(reason string) error {
	return fmt.Errorf("NSWatcher create failed: %s", reason)
}
