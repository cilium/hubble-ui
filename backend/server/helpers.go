package server

import "github.com/cilium/hubble-ui/backend/proto/ui"

func getFlagsWhichEventsRequested(events []ui.EventType) *eventFlags {
	flags := new(eventFlags)

	for _, event := range events {
		if event == FLOW_EVENT {
			flags.Flows = true
		}

		if event == SERVICE_STATE_EVENT {
			flags.Services = true
		}

		if event == SERVICE_LINK_EVENT {
			flags.ServiceLinks = true
		}

		if event == NS_STATE_EVENT {
			flags.Namespaces = true
		}
	}

	return flags
}

func (ef *eventFlags) FlowsRequired() bool {
	return ef.Flows || ef.Services || ef.ServiceLinks
}
