package flow_stream

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/cilium/api/v1/observer"
	hubbleTime "github.com/cilium/hubble/pkg/time"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

var (
	log = logger.New("get-flows-helpers")
)

func ExtractFlowsRequest(
	req *ui.GetEventsRequest,
) *observer.GetFlowsRequest {
	var bl, wl []*flow.FlowFilter

	for _, eventFilter := range req.GetBlacklist() {
		flowFilter := eventFilter.GetFlowFilter()
		if flowFilter == nil {
			continue
		}

		bl = append(bl, flowFilter)
	}

	for _, eventFilter := range req.GetWhitelist() {
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

func nerr(reason string) error {
	return fmt.Errorf("cannot create FlowStream: %s", reason)
}
