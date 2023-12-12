package api_helpers

import (
	"github.com/cilium/hubble-ui/backend/domain/events"
	"github.com/cilium/hubble-ui/backend/domain/namespaces"
	"github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func EventResponseFromNSEvent(e *common.NSEvent) *ui.GetEventsResponse {
	nodeName := "<timescape>"
	event := e.Event

	var stateChange ui.StateChange = ui.StateChange_MODIFIED
	if event == events.Added {
		stateChange = ui.StateChange_ADDED
	} else if event == events.Deleted {
		stateChange = ui.StateChange_DELETED
	}

	var desc *namespaces.Descriptor
	if e.K8sNamespace != nil {
		ns := e.K8sNamespace
		desc = namespaces.NewDescriptorFromK8sObject(ns)
		nodeName = "<relay>"
	}

	nsEvent := &ui.Event_NamespaceState{
		NamespaceState: &ui.NamespaceState{
			Namespace: desc.IntoProto(),
			Type:      stateChange,
		},
	}

	return &ui.GetEventsResponse{
		Node:      nodeName,
		Timestamp: timestamppb.Now(),
		Events: []*ui.Event{
			{
				Event: nsEvent,
			},
		},
	}
}
