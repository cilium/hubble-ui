package server

import (
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/client-go/tools/cache"

	"github.com/cilium/hubble-ui/backend/server/helpers"
)

func eventFromNSObject(event helpers.EventKind, obj interface{}) *helpers.NSEvent {
	ns := obj.(*v1.Namespace)

	return &helpers.NSEvent{event, ns}
}

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
		e := eventFromNSObject(helpers.Added, obj)

		eventChannel <- e
	}

	updateFunc := func(upd interface{}) {
		// Before deletion, ns updated to Terminating phase
		if upd.(*v1.Namespace).Status.Phase != v1.NamespaceActive {
			return
		}

		e := eventFromNSObject(helpers.Modified, upd)
		eventChannel <- e
	}

	deleteFunc := func(obj interface{}) {
		e := eventFromNSObject(helpers.Deleted, obj)
		eventChannel <- e
	}

	processFunc := func(obj interface{}) error {
		newest := obj.(cache.Deltas).Newest()

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
