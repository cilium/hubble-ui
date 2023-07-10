package nswatcher

import (
	"context"
	"sync"

	"github.com/sirupsen/logrus"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/cache"

	"github.com/cilium/hubble-ui/backend/internal/server/nswatcher/common"
	"github.com/cilium/hubble-ui/backend/internal/types"
)

type Watcher struct {
	log *logrus.Entry
	k8s kubernetes.Interface

	nsEvents chan *common.NSEvent
	errors   chan error
	stop     chan struct{}
	stopOnce sync.Once
}

func NewDumb() *Watcher {
	return new(Watcher)
}

func (w *Watcher) processEvent(ctx context.Context, obj interface{}) error {
	deltas, ok := obj.(cache.Deltas)
	if !ok {
		// not an object that this function should handle, simply ignore
		return nil
	}

	newest := deltas.Newest()
	ns, ok := newest.Object.(*v1.Namespace)
	if !ok {
		return nil
	}

	switch {
	case newest.Type == cache.Added || newest.Type == cache.Sync:
		w.handleNSAddition(ctx, newest.Object)
	case newest.Type == cache.Deleted || ns.Status.Phase == v1.NamespaceTerminating:
		w.handleNSDeletion(ctx, newest.Object)
	case newest.Type == cache.Updated:
		w.handleNSUpdate(ctx, newest.Object)
	}

	return nil
}

func (w *Watcher) handleNSAddition(ctx context.Context, obj interface{}) {
	e := common.EventFromNSObject(types.Added, obj)
	w.sendNSEvent(ctx, e)
}

func (w *Watcher) handleNSUpdate(ctx context.Context, upd interface{}) {
	// Before deletion, ns updated to Terminating phase
	ns, ok := upd.(*v1.Namespace)
	if !ok {
		return
	}

	if ns.Status.Phase != v1.NamespaceActive {
		return
	}

	e := common.EventFromNSObject(types.Modified, upd)
	w.sendNSEvent(ctx, e)
}

func (w *Watcher) handleNSDeletion(ctx context.Context, obj interface{}) {
	e := common.EventFromNSObject(types.Deleted, obj)
	w.sendNSEvent(ctx, e)
}

func (w *Watcher) Run(ctx context.Context) {
	restClient := w.k8s.CoreV1().RESTClient()
	nsWatcher := cache.NewListWatchFromClient(
		restClient,
		"namespaces",
		v1.NamespaceAll,
		fields.Everything(),
	)

	fifo := cache.NewDeltaFIFOWithOptions(cache.DeltaFIFOOptions{})
	cfg := &cache.Config{
		Queue:         fifo,
		ListerWatcher: nsWatcher,
		ObjectType:    &v1.Namespace{},
		Process: func(obj interface{}, isInInitialList bool) error {
			return w.processEvent(ctx, obj)
		},
		WatchErrorHandler: func(_ *cache.Reflector, err error) {
			w.sendError(ctx, err)
		},
	}

	w.log.Infof("watcher is running\n")
	cache.New(cfg).Run(w.stop)
}

func (w *Watcher) Stop() {
	w.stopOnce.Do(func() {
		if w.stop == nil {
			return
		}

		close(w.stop)
	})

	w.log.Infof("watcher is stopped\n")
}

func (w *Watcher) Errors() chan error {
	if w.errors == nil {
		w.errors = make(chan error)
	}

	return w.errors
}

func (w *Watcher) NSEvents() chan *common.NSEvent {
	if w.nsEvents == nil {
		w.nsEvents = make(chan *common.NSEvent)
	}

	return w.nsEvents
}

func (w *Watcher) sendNSEvent(ctx context.Context, nse *common.NSEvent) {
	select {
	case <-ctx.Done():
	case <-w.stop:
	case w.NSEvents() <- nse:
	}
}

func (w *Watcher) sendError(ctx context.Context, err error) {
	select {
	case <-ctx.Done():
	case <-w.stop:
	case w.Errors() <- err:
	}
}
