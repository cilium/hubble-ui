package server

import (
	"context"
	"fmt"
	"time"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/internal/server"
	"github.com/cilium/hubble-ui/backend/internal/server/statuschecker"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

func (srv *UIServer) GetStatus(ctx context.Context, _ *ui.GetStatusRequest) (
	*ui.GetStatusResponse, error,
) {
	var client *server.HubbleClient
	if c := ctx.Value("hubbleClient"); c != nil {
		client, _ = c.(*server.HubbleClient)
	}
	if client == nil {
		cl, err := srv.GetHubbleClientFromContext(ctx)
		if err != nil {
			log.Errorf(msg.ServerSetupRelayClientError, err)
			return nil, err
		}
		client = cl
	}

	ss, err := client.Handle.ServerStatus(
		ctx,
		&observer.ServerStatusRequest{},
	)

	if err != nil {
		return nil, err
	}

	resp := &ui.GetStatusResponse{
		Nodes:    nodeStatusFromSS(ss),
		Versions: nil,
		Flows:    flowsStatusFromSS(ss),
	}

	return resp, nil
}

func (srv *UIServer) RunStatusChecker(ctx context.Context) (
	*statuschecker.Handle, error,
) {
	connectFn := func(ctx context.Context, attempt int) (
		observer.ObserverClient, error,
	) {
		client, err := srv.GetHubbleClientFromContext(ctx)
		if err != nil {
			log.Errorf(msg.HubbleStatusCriticalError, err)
			return nil, err
		}

		log.Infof(msg.HubbleStatusCheckerRelayConnected)
		return client.Handle, nil
	}

	statusChecker, err := statuschecker.New().
		WithLogger(logger.Sub("status-checker")).
		WithDelay(3 * time.Second).
		WithNewClientFunction(connectFn).
		Unwrap()

	if err != nil {
		return nil, err
	}

	return statusChecker, nil
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
