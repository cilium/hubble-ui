package server

import (
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/client-go/tools/cache"

	"github.com/cilium/hubble-ui/backend/server/helpers"
)

func (srv *UIServer) RunNSWatcher() (chan *helpers.NSEvent, chan error, chan struct{}) {
	restClient := srv.k8s.CoreV1().RESTClient()
	nsWatcher := cache.NewListWatchFromClient(
		restClient,
		"namespaces",
		v1.NamespaceAll,
		fields.Everything(),
	)

	eventChannel := make(chan *helpers.NSEvent)
	errors := make(chan error)

	addFunc := func(obj interface{}) {
		if ns, ok := obj.(*v1.Namespace); ok {
			eventChannel <- &helpers.NSEvent{
				Event:     helpers.Added,
				Namespace: ns,
			}
		}
	}

	updateFunc := func(obj interface{}) {
		ns, ok := obj.(*v1.Namespace)
		if !ok {
			return
		}
		// Before deletion, ns updated to Terminating phase
		if ns.Status.Phase != v1.NamespaceActive {
			return
		}
		eventChannel <- &helpers.NSEvent{
			Event:     helpers.Modified,
			Namespace: ns,
		}
	}

	deleteFunc := func(obj interface{}) {
		if ns, ok := obj.(*v1.Namespace); ok {
			eventChannel <- &helpers.NSEvent{
				Event:     helpers.Deleted,
				Namespace: ns,
			}
		}
	}

	processFunc := func(obj interface{}) error {
		deltas, ok := obj.(cache.Deltas)
		if !ok {
			// not an object that this function should handle, simply ignore
			return nil
		}
		newest := deltas.Newest()
		if newest.Type == cache.Added || newest.Type == cache.Sync {
			addFunc(newest.Object)
		} else if newest.Type == cache.Deleted {
			deleteFunc(newest.Object)
		} else if newest.Type == cache.Updated {
			updateFunc(newest.Object)
		}

		return nil
	}

	fifo := cache.NewDeltaFIFOWithOptions(cache.DeltaFIFOOptions{})
	cfg := &cache.Config{
		Queue:         fifo,
		ListerWatcher: nsWatcher,
		ObjectType:    &v1.Namespace{},
		Process:       processFunc,
		WatchErrorHandler: func(_ *cache.Reflector, err error) {
			errors <- err
		},
	}

	stop := make(chan struct{})
	go cache.New(cfg).Run(stop)

	go func() {
		<-stop
		close(eventChannel)
	}()

	return eventChannel, errors, stop
}
