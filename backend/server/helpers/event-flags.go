package helpers

import "github.com/cilium/hubble-ui/backend/proto/ui"

type EventKind string

const (
	Added    EventKind = "added"
	Modified EventKind = "modified"
	Deleted  EventKind = "deleted"
	Exists   EventKind = "exists"
	Unknown  EventKind = "unknown"

	FLOW_EVENT          = ui.EventType_FLOW
	FLOWS_EVENT         = ui.EventType_FLOWS
	NS_STATE_EVENT      = ui.EventType_K8S_NAMESPACE_STATE
	SERVICE_STATE_EVENT = ui.EventType_SERVICE_STATE
	SERVICE_LINK_EVENT  = ui.EventType_SERVICE_LINK_STATE
)

type EventFlags struct {
	Flow            bool
	Flows           bool
	Services        bool
	ServiceLinks    bool
	Namespaces      bool
	NetworkPolicies bool
}

func (ef *EventFlags) FlowsRequired() bool {
	return ef.Flow || ef.Flows || ef.Services || ef.ServiceLinks
}
