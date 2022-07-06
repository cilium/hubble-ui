package helpers

import (
	"github.com/cilium/hubble-ui/backend/internal/server/nswatcher/common"
	"github.com/cilium/hubble-ui/backend/internal/types"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"google.golang.org/protobuf/types/known/timestamppb" //nolint
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func EventResponseFromNSEvent(e *common.NSEvent) *ui.GetEventsResponse {
	var stateChange ui.StateChange
	var ts metaV1.Time
	ns := e.K8sNamespace

	switch e.Event {
	case types.Added:
		ts = ns.CreationTimestamp
		stateChange = ui.StateChange_ADDED
	case types.Deleted:
		ts = *ns.DeletionTimestamp
		stateChange = ui.StateChange_DELETED
	case types.Modified, types.Exists, types.Unknown:
		ts = metaV1.Now()
		stateChange = ui.StateChange_MODIFIED
	}

	creationTimestamp := timestamppb.New(ns.CreationTimestamp.Time)
	eventTimestamp := timestamppb.New(ts.Time)

	state := &ui.K8SNamespaceState{
		Namespace: &ui.K8SNamespace{
			Id:                string(ns.UID),
			Name:              ns.Name,
			CreationTimestamp: creationTimestamp,
		},
		Type: stateChange,
	}

	nsEvent := &ui.GetEventsResponse_K8SNamespaceState{
		K8SNamespaceState: state,
	}

	return &ui.GetEventsResponse{
		Node:      "",
		Timestamp: eventTimestamp,
		Event:     nsEvent,
	}
}
