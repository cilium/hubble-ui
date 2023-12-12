package api_helpers

import (
	"github.com/cilium/hubble-ui/backend/domain/cache"
	"github.com/cilium/hubble-ui/backend/domain/events"
	"github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/link"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func EventResponseFromEverything(
	flows []*flow.Flow,
	links []cache.Result[*link.Link],
	svcs []cache.Result[*service.Service],
) *ui.GetEventsResponse {
	resp := &ui.GetEventsResponse{
		Node:      "",
		Timestamp: timestamppb.Now(),
		Events:    []*ui.Event{},
	}

	resp.Events = append(resp.GetEvents(), EventFromFlows(flows))

	for _, l := range links {
		resp.Events = append(resp.GetEvents(), EventFromLinkResult(l))
	}

	for _, s := range svcs {
		resp.Events = append(resp.GetEvents(), EventFromServiceResult(s))
	}

	return resp
}

func EventFromServiceResult(s cache.Result[*service.Service]) *ui.Event {
	return &ui.Event{
		Event: &ui.Event_ServiceState{
			ServiceState: &ui.ServiceState{
				Service: s.Entry.ToProto(),
				Type:    StateChangeFromEventKind(s.EventKind),
			},
		},
	}
}

func EventFromLinkResult(l cache.Result[*link.Link]) *ui.Event {
	return &ui.Event{
		Event: &ui.Event_ServiceLinkState{
			ServiceLinkState: &ui.ServiceLinkState{
				ServiceLink: l.Entry.ToProto(),
				Type:        StateChangeFromEventKind(l.EventKind),
			},
		},
	}
}

func EventFromFlows(f []*flow.Flow) *ui.Event {
	return &ui.Event{
		Event: &ui.Event_Flows{
			Flows: &ui.Flows{
				Flows: flow.Unwrap(f),
			},
		},
	}
}

func StateChangeFromEventKind(cflags events.EventKind) ui.StateChange {
	switch cflags {
	case events.Exists:
		return ui.StateChange_EXISTS
	case events.Added:
		return ui.StateChange_ADDED
	case events.Modified:
		return ui.StateChange_MODIFIED
	case events.Deleted:
		return ui.StateChange_DELETED
	default:
		return ui.StateChange_UNKNOWN_STATE_CHANGE
	}
}
