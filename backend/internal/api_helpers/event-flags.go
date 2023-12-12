package api_helpers

import "github.com/cilium/hubble-ui/backend/proto/ui"

const (
	FLOW_EVENT          = ui.EventType_FLOW
	FLOWS_EVENT         = ui.EventType_FLOWS
	NS_STATE_EVENT      = ui.EventType_K8S_NAMESPACE_STATE
	SERVICE_STATE_EVENT = ui.EventType_SERVICE_STATE
	SERVICE_LINK_EVENT  = ui.EventType_SERVICE_LINK_STATE
	STATUS_EVENT        = ui.EventType_STATUS
)

type EventFlags struct {
	Flow            bool
	Flows           bool
	Services        bool
	ServiceLinks    bool
	Namespaces      bool
	Status          bool
	NetworkPolicies bool
}

func (ef *EventFlags) FlowsRequired() bool {
	return ef.Flow || ef.Flows || ef.Services || ef.ServiceLinks
}

func (ef *EventFlags) StatusRequired() bool {
	return ef.Status
}

func GetFlagsWhichEventsRequested(events []ui.EventType) *EventFlags {
	flags := new(EventFlags)

	for _, event := range events {
		flags.Flow = flags.Flow || event == FLOW_EVENT
		flags.Flows = flags.Flows || event == FLOWS_EVENT
		flags.Services = flags.Services || event == SERVICE_STATE_EVENT
		flags.ServiceLinks = flags.ServiceLinks || event == SERVICE_LINK_EVENT
		flags.Namespaces = flags.Namespaces || event == NS_STATE_EVENT
		flags.Status = flags.Status || event == STATUS_EVENT
	}

	return flags
}
