package server

import (
	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/link"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

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

func eventResponseForService(
	f *pbFlow.Flow, svc *ui.Service, cflags *cacheFlags,
) *ui.GetEventsResponse {
	sstate := &ui.ServiceState{
		Service: svc,
		Type:    stateChangeFromCacheFlags(cflags),
	}

	return &ui.GetEventsResponse{
		Node:      f.NodeName,
		Timestamp: f.Time,
		Event:     &ui.GetEventsResponse_ServiceState{sstate},
	}
}

func eventResponseForLink(
	l *link.Link, cflags *cacheFlags,
) *ui.GetEventsResponse {
	f := l.IntoFlow()
	lstate := &ui.ServiceLinkState{
		ServiceLink: l.ToProto(),
		Type:        stateChangeFromCacheFlags(cflags),
	}

	return &ui.GetEventsResponse{
		Node:      f.NodeName,
		Timestamp: f.Time,
		Event:     &ui.GetEventsResponse_ServiceLinkState{lstate},
	}
}

func stateChangeFromCacheFlags(cflags *cacheFlags) ui.StateChange {
	if cflags.Exists {
		return ui.StateChange_EXISTS
	} else if cflags.Created {
		return ui.StateChange_ADDED
	} else if cflags.Updated {
		return ui.StateChange_MODIFIED
	} else if cflags.Deleted {
		return ui.StateChange_DELETED
	}

	return ui.StateChange_UNKNOWN_STATE_CHANGE
}
