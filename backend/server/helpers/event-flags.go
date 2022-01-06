package helpers

import "github.com/cilium/hubble-ui/backend/proto/ui"

type EventKind string

const (
	Added    EventKind = "added"
	Modified EventKind = "modified"
	Deleted  EventKind = "deleted"
	Exists   EventKind = "exists"
	Unknown  EventKind = "unknown"

	FlowEvent         = ui.EventType_FLOW
	FlowsEvent        = ui.EventType_FLOWS
	NsStateEvent      = ui.EventType_K8S_NAMESPACE_STATE
	ServiceStateEvent = ui.EventType_SERVICE_STATE
	ServiceLinkEvent  = ui.EventType_SERVICE_LINK_STATE
	StatusEvent       = ui.EventType_STATUS
)

type EventFlags struct {
	Flow         bool
	Flows        bool
	Services     bool
	ServiceLinks bool
	Namespaces   bool
	Status       bool
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
		flags.Flow = flags.Flow || event == FlowEvent
		flags.Flows = flags.Flows || event == FlowsEvent
		flags.Services = flags.Services || event == ServiceStateEvent
		flags.ServiceLinks = flags.ServiceLinks || event == ServiceLinkEvent
		flags.Namespaces = flags.Namespaces || event == NsStateEvent
		flags.Status = flags.Status || event == StatusEvent
	}

	return flags
}
