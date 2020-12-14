package server

import (
	"context"
	"fmt"
	"time"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"github.com/cilium/hubble-ui/backend/server/helpers"
)

func (srv *UIServer) GetStatus(ctx context.Context, _ *ui.GetStatusRequest) (
	*ui.GetStatusResponse, error,
) {
	ss, err := srv.hubbleClient.ServerStatus(
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

func (srv *UIServer) RunStatusChecker(req *ui.GetStatusRequest) (
	context.CancelFunc, chan *ui.GetEventsResponse, chan error,
) {
	ctx, cancel := context.WithCancel(context.Background())

	responses := make(chan *ui.GetEventsResponse)
	errors := make(chan error)

	delay := time.Second * 1

	go func() {
		ticker := time.Tick(delay)
		lastCheck := time.Now()

		sendError := func(err error) {
			select {
			case <-ctx.Done():
				return
			case errors <- err:
				return
			}
		}

		sendResponse := func(resp *ui.GetStatusResponse) {
			select {
			case <-ctx.Done():
				return
			case responses <- helpers.EventResponseFromStatusResponse(resp):
				return
			}
		}
	F:
		for {
			var lastError error = nil

			select {
			case <-ctx.Done():
				log.Infof("hubble status checker: stopped\n")
				break F
			case <-ticker:
				if time.Since(lastCheck) < delay {
					continue F
				}

				resp, err := srv.GetStatus(ctx, req)
				if err != nil {
					lastError = err
					sendError(err)
					break
				}

				sendResponse(resp)
				lastCheck = time.Now()

				continue F
			}

			retries := srv.newRetries()
			for {
				if !srv.IsGrpcUnavailable(lastError) {
					break F
				}

				err := retries.Wait(ctx)
				if err != nil {
					continue F
				}

				resp, err := srv.GetStatus(ctx, req)
				if err != nil {
					sendError(err)
					lastError = err
					continue
				}

				lastCheck = time.Now()
				log.Infof("hubble status checker: connection to hubble-relay established\n")
				if resp != nil {
					sendResponse(resp)
				}

				continue F
			}
		}

		close(responses)
		close(errors)
	}()

	return cancel, responses, errors
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

		idx += 1
	}

	// TODO: need somehow to get their names
	for i := 0; i < numConnected; i += 1 {
		statuses[idx] = &ui.NodeStatus{
			Name:        fmt.Sprintf("Connected node %d", i+1),
			IsAvailable: true,
		}

		idx += 1
	}

	return statuses
}
