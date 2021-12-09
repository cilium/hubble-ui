// helpers/helpers.go
package helpers

import (
	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/cache"
	"github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/link"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"github.com/golang/protobuf/ptypes"
)

func EventResponseForService(
	svc *service.Service, cflags *cache.CacheFlags,
) *ui.GetEventsResponse {
	sstate := &ui.ServiceState{
		Service: svc.ToProto(),
		Type:    StateChangeFromCacheFlags(cflags),
	}

	f := svc.FlowRef()

	return &ui.GetEventsResponse{
		Node:      f.NodeName,
		Timestamp: f.Time,
		Event:     &ui.GetEventsResponse_ServiceState{sstate},
	}
}

func EventResponseForLink(
	l *link.Link, cflags *cache.CacheFlags,
) *ui.GetEventsResponse {
	f := l.IntoFlow()
	lstate := &ui.ServiceLinkState{
		ServiceLink: l.ToProto(),
		Type:        StateChangeFromCacheFlags(cflags),
	}

	return &ui.GetEventsResponse{
		Node:      f.NodeName,
		Timestamp: f.Time,
		Event:     &ui.GetEventsResponse_ServiceLinkState{lstate},
	}
}

func EventResponseFromFlow(f *flow.Flow) *ui.GetEventsResponse {
	ref := f.Ref()
	return &ui.GetEventsResponse{
		Node:      ref.NodeName,
		Timestamp: ref.Time,
		Event:     &ui.GetEventsResponse_Flow{ref},
	}
}

func EventResponseFromRawFlows(flows []*pbFlow.Flow) *ui.GetEventsResponse {
	n := len(flows)
	if n == 0 {
		return nil
	}

	ref := flows[n-1]
	return &ui.GetEventsResponse{
		Node:      ref.NodeName,
		Timestamp: ref.Time,
		Event: &ui.GetEventsResponse_Flows{
			Flows: &ui.Flows{
				Flows: flows,
			},
		},
	}
}

func EventResponseFromStatusResponse(
	st *ui.GetStatusResponse,
) *ui.GetEventsResponse {
	return &ui.GetEventsResponse{
		Node:      "backend",
		Timestamp: ptypes.TimestampNow(),
		Event: &ui.GetEventsResponse_Notification{
			Notification: &ui.Notification{
				Notification: &ui.Notification_Status{st},
			},
		},
	}
}

func notificationConnState(
	connected,
	reconnecting,
	k8sUnavailable,
	k8sConnected bool,
) *ui.Notification {
	return &ui.Notification{
		Notification: &ui.Notification_ConnState{
			ConnState: &ui.ConnectionState{
				Connected:      connected,
				Reconnecting:   reconnecting,
				K8SUnavailable: k8sUnavailable,
				K8SConnected:   k8sConnected,
			},
		},
	}
}

func EventResponseReconnecting() *ui.GetEventsResponse {
	return &ui.GetEventsResponse{
		Node:      "backend",
		Timestamp: ptypes.TimestampNow(),
		Event: &ui.GetEventsResponse_Notification{
			Notification: notificationConnState(false, true, false, false),
		},
	}
}

func EventResponseConnected() *ui.GetEventsResponse {
	return &ui.GetEventsResponse{
		Node:      "backend",
		Timestamp: ptypes.TimestampNow(),
		Event: &ui.GetEventsResponse_Notification{
			Notification: notificationConnState(true, false, false, false),
		},
	}
}

func EventResponseK8sUnavailable() *ui.GetEventsResponse {
	return &ui.GetEventsResponse{
		Node:      "backend",
		Timestamp: ptypes.TimestampNow(),
		Event: &ui.GetEventsResponse_Notification{
			Notification: notificationConnState(false, false, true, false),
		},
	}
}

func EventResponseK8sConnected() *ui.GetEventsResponse {
	return &ui.GetEventsResponse{
		Node:      "backend",
		Timestamp: ptypes.TimestampNow(),
		Event: &ui.GetEventsResponse_Notification{
			Notification: notificationConnState(false, false, false, true),
		},
	}
}

func EventResponseNoPermission(resource string, error string) *ui.GetEventsResponse {
	notif := &ui.Notification{
		Notification: &ui.Notification_NoPermission{
			NoPermission: &ui.NoPermission{
				Resource: resource,
				Error:    error,
			},
		},
	}

	return &ui.GetEventsResponse{
		Node:      "backend",
		Timestamp: ptypes.TimestampNow(),
		Event: &ui.GetEventsResponse_Notification{
			Notification: notif,
		},
	}
}

func StateChangeFromCacheFlags(cflags *cache.CacheFlags) ui.StateChange {
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
