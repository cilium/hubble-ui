package server

import (
	"github.com/golang/protobuf/ptypes"
	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/fields"
	"k8s.io/client-go/tools/cache"

	"github.com/cilium/hubble-ui/backend/proto/ui"
)

type NSEvent struct {
	Event     string
	Namespace *v1.Namespace
}

func eventFromNSObject(event string, obj interface{}) *NSEvent {
	ns := obj.(*v1.Namespace)

	return &NSEvent{event, ns}
}

func (srv *UIServer) RunNSWatcher() (chan *NSEvent, chan struct{}) {
	restClient := srv.k8s.CoreV1().RESTClient()
	nsWatcher := cache.NewListWatchFromClient(
		restClient,
		"namespaces",
		v1.NamespaceAll,
		fields.Everything(),
	)

	eventChannel := make(chan *NSEvent)

	eventHandlers := cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			e := eventFromNSObject("added", obj)

			eventChannel <- e
		},
		UpdateFunc: func(old, upd interface{}) {

			// Before deletion, ns updated to Terminating phase
			if upd.(*v1.Namespace).Status.Phase != v1.NamespaceActive {
				return
			}

			e := eventFromNSObject("updated", upd)
			eventChannel <- e
		},
		DeleteFunc: func(obj interface{}) {

			e := eventFromNSObject("deleted", obj)
			eventChannel <- e
		},
	}

	_, controller := cache.NewInformer(
		nsWatcher,
		&v1.Namespace{},
		0,
		eventHandlers,
	)

	log.Infof("running namespace watcher\n")
	stop := make(chan struct{})

	go controller.Run(stop)
	go func() {
		<-stop
		close(eventChannel)
	}()

	return eventChannel, stop
}

func respFromNSEvent(e *NSEvent) *ui.GetEventsResponse {
	ns := e.Namespace
	event := e.Event

	ts := metaV1.Now()
	var stateChange ui.StateChange = ui.StateChange_MODIFIED

	if event == "added" {
		ts = ns.CreationTimestamp
		stateChange = ui.StateChange_ADDED
	} else if event == "deleted" {
		ts = *ns.DeletionTimestamp
		stateChange = ui.StateChange_DELETED
	}

	creationTimestamp, err := ptypes.TimestampProto(ns.CreationTimestamp.Time)
	if err != nil {
		log.Errorf("failed to convert timestamp from k8s to pb: %v\n", err)
	}

	eventTimestamp, err := ptypes.TimestampProto(ts.Time)
	if err != nil {
		log.Errorf("failed to convert timestamp from k8s to pb: %v\n", err)
	}

	state := &ui.K8SNamespaceState{
		Namespace: &ui.K8SNamespace{
			Id:                string(ns.UID),
			Name:              ns.Name,
			CreationTimestamp: creationTimestamp,
		},
		Type: stateChange,
	}

	nsEvent := &ui.GetEventsResponse_K8SNamespaceState{state}

	return &ui.GetEventsResponse{
		Node:      ns.ClusterName, // not node name but though
		Timestamp: eventTimestamp,
		Event:     nsEvent,
	}
}
