package timings

import (
	"math"
	"time"

	"github.com/cilium/hubble-ui/backend/pkg/delays"
	"github.com/cilium/hubble-ui/backend/pkg/rate_counter"
)

type RouterTimings struct {
	// NOTE: Max delay a route can wait for outgoing message from handler
	RouteResumePollTimeout time.Duration

	// NOTE: Min and max values used to calculate a delay for client to poll
	clientPollMin time.Duration
	clientPollMax time.Duration

	GarbageCollectionDelay time.Duration
}

func (rt *RouterTimings) ChannelTimings() (*ChannelTimings, error) {
	delayCurve, err := delays.NewNegativeExponential(
		float64(rt.clientPollMin.Milliseconds()),
		float64(rt.clientPollMax.Milliseconds()),
		0.5,
	)

	if err != nil {
		return nil, err
	}

	return &ChannelTimings{
		minClientPollDelay:     rt.clientPollMin,
		maxClientPollDelay:     rt.clientPollMax,
		currentPollDelayFactor: math.Inf(0),
		clientPollDelayCurve:   delayCurve,
		incomings:              rate_counter.New(),
		outgoings:              rate_counter.New(),
		incomingPayloads:       rate_counter.New(),
		outgoingPayloads:       rate_counter.New(),
	}, nil
}
