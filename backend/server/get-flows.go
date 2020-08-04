package server

import (
	"context"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

func extractFlowsRequest(req *ui.GetEventsRequest) *observer.GetFlowsRequest {
	var bl, wl []*flow.FlowFilter

	for _, eventFilter := range req.Blacklist {
		flowFilter := eventFilter.GetFlowFilter()
		if flowFilter == nil {
			continue
		}

		bl = append(bl, flowFilter)
	}

	for _, eventFilter := range req.Whitelist {
		flowFilter := eventFilter.GetFlowFilter()
		if flowFilter == nil {
			continue
		}

		wl = append(wl, flowFilter)
	}

	return &observer.GetFlowsRequest{
		Blacklist: bl,
		Whitelist: wl,
		Since:     req.Since,
		Follow:    true,
	}
}

func (srv *UIServer) GetFlows(req *ui.GetEventsRequest) (
	FlowStream, context.CancelFunc, error,
) {
	// TODO: handle context cancellation
	ctx, cancel := context.WithCancel(context.Background())
	flowsRequest := extractFlowsRequest(req)

	fs, err := srv.hubbleClient.GetFlows(ctx, flowsRequest)
	if err != nil {
		return nil, nil, err
	}

	return fs, cancel, nil
}
