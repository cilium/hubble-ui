package server

import (
	"context"
	"os"
	"strconv"
	"time"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	hubbleTime "github.com/cilium/hubble/pkg/time"
	"github.com/golang/protobuf/ptypes"

	dflow "github.com/cilium/hubble-ui/backend/domain/flow"
)

func (srv *UIServer) GetFlows(
	req *ui.GetEventsRequest,
	responses chan *ui.GetEventsResponse,
	errors chan error,
) (context.CancelFunc, error) {
	// TODO: handle context cancellation
	ctx, cancel := context.WithCancel(context.Background())
	flowsRequest := extractFlowsRequest(req)

	var flowStream FlowStream
	err := srv.RetryIfGrpcUnavailable(func(attempt int) error {
		if attempt > 0 {
			log.Warnf("GetFlows: attempt #%d\n", attempt)
		}

		fs, err := srv.hubbleClient.GetFlows(ctx, flowsRequest)
		if err != nil {
			return err
		}

		flowStream = fs
		return nil
	})

	if err != nil {
		return nil, err
	}

	go func() {
	F:
		for {
			select {
			case <-ctx.Done():
				break F
			default:
				flowResponse, err := flowStream.Recv()
				if err != nil {
					errors <- err
					break F
				}

				pbFlow := flowResponse.GetFlow()
				if pbFlow == nil {
					continue F
				}

				f := dflow.FromProto(pbFlow)
				responses <- eventResponseFromFlow(f)
			}
		}
	}()

	return cancel, nil
}

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

	// below is a workaround for cilium/hubble bug
	// https://github.com/cilium/hubble/issues/363
	var (
		getFlowsSinceTime  time.Time
		getFlowsLastNumber int
		err                error
		isGetSinceSet      bool
		isGetLastSet       bool
	)

	request := observer.GetFlowsRequest{
		Blacklist: bl,
		Whitelist: wl,
		Follow:    true,
	}

	getFlowsLast, isGetLastSet := os.LookupEnv("GET_FLOWS_LAST")
	// set default value to get last flows,
	// unless user explicitly sets it to 0
	if !isGetLastSet {
		request.Number = 10000
	} else {
		if getFlowsLastNumber, err = strconv.Atoi(getFlowsLast); err != nil {
			log.Errorf("failed to convert GET_FLOWS_LAST to int, falling back to default value (10000): %v\n", err)
			request.Number = 10000
		} else {
			request.Number = uint64(getFlowsLastNumber)
		}
	}

	getFlowsSince, isGetSinceSet := os.LookupEnv("GET_FLOWS_SINCE")
	if isGetSinceSet {
		if getFlowsSinceTime, err = hubbleTime.FromString(getFlowsSince); err != nil {
			log.Errorf("failed to parse GET_FLOWS_SINCE: %v\n", err)
		} else {
			request.Since, err = ptypes.TimestampProto(getFlowsSinceTime)
			if err != nil {
				log.Errorf("failed to use GET_FLOWS_SINCE: %v\n", err)
			}
		}
	}

	log.Infof("Get flows request: %v", request)
	return &request
}
