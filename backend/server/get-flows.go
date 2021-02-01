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
	"github.com/golang/protobuf/ptypes"

	dflow "github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/server/helpers"
)

func (srv *UIServer) GetFlows(req *ui.GetEventsRequest) (
	context.CancelFunc, chan *ui.GetEventsResponse, chan error,
) {
	// TODO: handle context cancellation
	flowsRequest := extractFlowsRequest(req)
	ctx, cancel := context.WithCancel(context.Background())

	responses := make(chan *ui.GetEventsResponse)
	errors := make(chan error)

	var flowStream FlowStream = nil
	retry := func(attempt int) error {
		log.Infof(msg.GetFlowsConnectingToRelay, attempt)

		fs, err := srv.hubbleClient.GetFlows(ctx, flowsRequest)
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

			sourceId, destId := service.IdsFromFlowProto(pbFlow)
			if sourceId == "0" || destId == "0" {
				log.Warnf(msg.ZeroIdentityInSourceOrDest)
				printPBFlowJson(pbFlow)

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

func printPBFlowJson(pbFlow *flow.Flow) {
	serialized, err := json.Marshal(pbFlow)
	if err != nil {
		log.Errorf("failed to marshal flow to json: %v\n", err)
		return
	}

	log.Warnf(msg.PrintZeroIdentityFlowJson, string(serialized))
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
			request.Since, err = ptypes.TimestampProto(getFlowsSinceTime)
			if err != nil {
				log.Errorf(msg.GetFlowsSinceUseError, err)
			}
		}
	}

	log.Infof("Get flows request: %v", request)
	return &request
}
