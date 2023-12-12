package notifications

import (
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Notification struct {
	ref *ui.Notification
}

func (n *Notification) AsEventResponse() *ui.GetEventsResponse {
	return &ui.GetEventsResponse{
		Node:      "backend-node",
		Timestamp: timestamppb.Now(),
		Events: []*ui.Event{
			{
				Event: &ui.Event_Notification{
					Notification: n.ref,
				},
			},
		},
	}
}

func (n *Notification) AsControlResponse() *ui.GetControlStreamResponse {
	return &ui.GetControlStreamResponse{
		Event: &ui.GetControlStreamResponse_Notification{
			Notification: n.ref,
		},
	}
}

// NOTE: Notification constructors are below
func NewRelayReconnecting() *Notification {
	notif, connState := newNotifConnState()
	connState.RelayReconnecting = true

	return &Notification{
		ref: notif,
	}
}

func NewRelayConnected() *Notification {
	notif, connState := newNotifConnState()
	connState.RelayConnected = true

	return &Notification{
		ref: notif,
	}
}

func NewK8sUnavailable() *Notification {
	notif, connState := newNotifConnState()
	connState.K8SUnavailable = true

	return &Notification{
		ref: notif,
	}
}

func NewK8sConnected() *Notification {
	notif, connState := newNotifConnState()
	connState.K8SConnected = true

	return &Notification{
		ref: notif,
	}
}

func NewNoPermission(resource, err string) *Notification {
	return &Notification{
		ref: &ui.Notification{
			Notification: &ui.Notification_NoPermission{
				NoPermission: &ui.NoPermission{
					Resource: resource,
					Error:    err,
				},
			},
		},
	}
}

func newNotifConnState() (*ui.Notification, *ui.ConnectionState) {
	connState := new(ui.ConnectionState)

	return &ui.Notification{
		Notification: &ui.Notification_ConnState{
			ConnState: connState,
		},
	}, connState
}
