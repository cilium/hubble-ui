package helpers

import (
	"fmt"
	"time"

	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

func StatusResponseFromServerStatus(
	ss *observer.ServerStatusResponse,
) *ui.GetStatusResponse {
	return &ui.GetStatusResponse{
		Nodes:    nodeStatusFromSS(ss),
		Versions: nil,
		Flows:    flowsStatusFromSS(ss),
	}
}

func EventResponseFromStatusResponse(
	st *ui.GetStatusResponse,
) *ui.GetEventsResponse {
	return &ui.GetEventsResponse{
		Node:      "backend",
		Timestamp: timestamppb.Now(),
		Event: &ui.GetEventsResponse_Notification{
			Notification: &ui.Notification{
				Notification: &ui.Notification_Status{
					Status: st,
				},
			},
		},
	}
}

func EventResponseFromServerStatus(
	ss *observer.ServerStatusResponse,
) *ui.GetEventsResponse {
	return EventResponseFromStatusResponse(
		StatusResponseFromServerStatus(ss),
	)
}

func ServerStatusNotification(ss *observer.ServerStatusResponse) *ui.Notification {
	st := StatusResponseFromServerStatus(ss)

	return &ui.Notification{
		Notification: &ui.Notification_Status{
			Status: st,
		},
	}
}

func flowsStatusFromSS(ss *observer.ServerStatusResponse) *ui.FlowStats {
	perSecond := 0.0
	if uptime := time.Duration(ss.UptimeNs).Seconds(); uptime > 0 {
		perSecond = float64(ss.SeenFlows) / uptime
	}

	return &ui.FlowStats{
		PerSecond: float32(perSecond),
	}
}

func nodeStatusFromSS(ss *observer.ServerStatusResponse) []*ui.NodeStatus {
	numConnected := 0
	numUnavailable := 0

	if ss.NumConnectedNodes != nil {
		numConnected = int(ss.NumConnectedNodes.Value)
	}

	if ss.NumUnavailableNodes != nil {
		numUnavailable = int(ss.NumUnavailableNodes.Value)
	}

	statuses := make([]*ui.NodeStatus, numConnected+numUnavailable)
	idx := 0
	for _, nodeName := range ss.UnavailableNodes {
		statuses[idx] = &ui.NodeStatus{
			Name:        nodeName,
			IsAvailable: false,
		}

		idx++
	}

	// TODO: need somehow to get their names
	for i := 0; i < numConnected; i++ {
		statuses[idx] = &ui.NodeStatus{
			Name:        fmt.Sprintf("Connected node %d", i+1),
			IsAvailable: true,
		}

		idx++
	}

	return statuses
}
