package server

import (
	"context"
	"encoding/json"
	"os"
	"strconv"
	"time"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	hubbleTime "github.com/cilium/hubble/pkg/time"
	"google.golang.org/protobuf/types/known/timestamppb"

	dflow "github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/server/helpers"
)

func (srv *UIServer) GetFlows(
	streamContext context.Context, req *ui.GetEventsRequest,
) (
	context.CancelFunc, chan *ui.GetEventsResponse, chan error,
) {
	// TODO: handle context cancellation
	flowsRequest := extractFlowsRequest(req)
	log.Infof("Get flows request: %v", flowsRequest)

	ctx, cancel := context.WithCancel(context.Background())
	responses := make(chan *ui.GetEventsResponse)
	errors := make(chan error)

	var flowStream FlowStream
	retry := func(attempt int) error {
		log.Infof(msg.GetFlowsConnectingToRelay, attempt)

		client, err := srv.GetHubbleClientFromContext(streamContext)
		if err != nil {
			log.Errorf(msg.ServerSetupRelayClientError, err)
			return err
		}

		fs, err := client.Handle.GetFlows(ctx, flowsRequest)
		if err != nil {
			log.Errorf(msg.GetFlowsConnectionAttemptError, attempt, err)
			return err
		}

		log.Infof(msg.GetFlowsConnectedToRelay)
		flowStream = fs
		return nil
	}

	go func() {
	F:
		for {
			if flowStream == nil {
				err := srv.RetryIfGrpcUnavailable(ctx, retry)
				if err != nil {
					// NOTE: if err is not nil, then ctx is canceled
					break F
				}
			}

			flowResponse, err := flowStream.Recv()
			if err != nil {
				select {
				case <-ctx.Done():
					break F
				case errors <- err:
					flowStream = nil
					continue F
				}
			}

			pbFlow := flowResponse.GetFlow()
			if pbFlow == nil {
				continue F
			}

			sourceID, destID := service.IDsFromFlowProto(pbFlow)
			if sourceID == "0" || destID == "0" {
				log.Warnf(msg.ZeroIdentityInSourceOrDest)
				printPBFlowJSON(pbFlow)

				continue F

			}

			f := dflow.FromProto(pbFlow)

			select {
			case <-ctx.Done():
				break F
			case responses <- helpers.EventResponseFromFlow(f):
				continue F
			}
		}

		close(errors)
		close(responses)
		log.Infof(msg.GetFlowsUIStreamisClosed)
	}()

	return cancel, responses, errors
}

func printPBFlowJSON(pbFlow *flow.Flow) {
	serialized, err := json.Marshal(pbFlow)
	if err != nil {
		log.Errorf("failed to marshal flow to json: %v\n", err)
		return
	}

	log.Warnf(msg.PrintZeroIdentityFlowJSON, string(serialized))
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
			log.Errorf(msg.GetFlowsLastParseError, err)
			request.Number = 10000
		} else {
			request.Number = uint64(getFlowsLastNumber)
		}
	}

	getFlowsSince, isGetSinceSet := os.LookupEnv("GET_FLOWS_SINCE")
	if isGetSinceSet {
		if getFlowsSinceTime, err = hubbleTime.FromString(getFlowsSince); err != nil {
			log.Errorf(msg.GetFlowsSinceParseError, err)
		} else {
			request.Since = timestamppb.New(getFlowsSinceTime)
		}
	}

	return &request
}
