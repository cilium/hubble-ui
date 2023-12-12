package api_helpers

import (
	"time"

	"github.com/cilium/cilium/api/v1/observer"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/cilium/hubble-ui/backend/internal/statuschecker"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

func StatusResponseFromServerStatus(
	fullStatus *statuschecker.FullStatus,
) *ui.GetStatusResponse {
	return &ui.GetStatusResponse{
		Nodes:        fullStatus.Nodes,
		ServerStatus: fullStatus.Status,
		Versions:     nil,
		Flows:        flowsStatusFromSS(fullStatus.Status),
	}
}

func EventResponseFromStatusResponse(
	st *ui.GetStatusResponse,
) *ui.GetEventsResponse {
	return &ui.GetEventsResponse{
		Node:      "ui-backend",
		Timestamp: timestamppb.Now(),
		Events: []*ui.Event{
			{
				Event: &ui.Event_Notification{
					Notification: &ui.Notification{
						Notification: &ui.Notification_Status{
							Status: st,
						},
					},
				},
			},
		},
	}
}

func EventResponseFromServerStatus(
	fullStatus *statuschecker.FullStatus,
) *ui.GetEventsResponse {
	return EventResponseFromStatusResponse(
		StatusResponseFromServerStatus(fullStatus),
	)
}

func ServerStatusNotification(
	fullStatus *statuschecker.FullStatus,
) *ui.Notification {
	st := StatusResponseFromServerStatus(fullStatus)

	return &ui.Notification{
		Notification: &ui.Notification_Status{
			Status: st,
		},
	}
}

func flowsStatusFromSS(ss *observer.ServerStatusResponse) *ui.FlowStats {
	perSecond := 0.0
	if uptime := time.Duration(ss.GetUptimeNs()).Seconds(); uptime > 0 {
		perSecond = float64(ss.GetSeenFlows()) / uptime
	}

	return &ui.FlowStats{
		PerSecond: float32(perSecond),
	}
}
