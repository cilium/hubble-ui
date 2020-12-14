package helpers

import (
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"github.com/golang/protobuf/ptypes"
	v1 "k8s.io/api/core/v1"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type NSEvent struct {
	Event     EventKind
	Namespace *v1.Namespace
}

func EventResponseFromNSEvent(e *NSEvent) *ui.GetEventsResponse {
	ns := e.Namespace
	event := e.Event

	ts := metaV1.Now()
	var stateChange ui.StateChange = ui.StateChange_MODIFIED

	if event == Added {
		ts = ns.CreationTimestamp
		stateChange = ui.StateChange_ADDED
	} else if event == Deleted {
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
