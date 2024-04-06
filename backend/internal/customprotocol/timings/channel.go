package timings

import (
	"math"
	"time"

	"github.com/cilium/hubble-ui/backend/pkg/delays"
	"github.com/cilium/hubble-ui/backend/pkg/rate_counter"
)

type ChannelTimings struct {
	minClientPollDelay     time.Duration
	maxClientPollDelay     time.Duration
	currentPollDelayFactor float64
	clientPollDelayCurve   delays.SmoothNormalizedFn

	incomings *rate_counter.RateCounter
	outgoings *rate_counter.RateCounter

	incomingPayloads *rate_counter.RateCounter
	outgoingPayloads *rate_counter.RateCounter
}

func (ct *ChannelTimings) CountIncomingMessage() {
	ct.incomings.Count()
}

func (ct *ChannelTimings) CountOutgoingMessage() {
	ct.outgoings.Count()
}

func (ct *ChannelTimings) CountIncomingPayload() {
	ct.incomingPayloads.Count()
}

func (ct *ChannelTimings) CountOutgoingPayload() {
	ct.outgoingPayloads.Count()
}

// NOTE: This function is assumed to be called after outgoing message is popped
func (ct *ChannelTimings) ClientPollDelay(noutgoings uint) time.Duration {
	// NOTE: If there is pending outgoing message, the client should poll
	// as fast as possible
	if noutgoings > 0 {
		return ct.minClientPollDelay
	}

	ct.currentPollDelayFactor = ct.getNormalizedDelayFactor()
	delay := ct.clientPollDelayCurve.Calc(ct.currentPollDelayFactor)
	return time.Duration(delay) * time.Millisecond
}

func (ct *ChannelTimings) IsStaleDuration(past time.Duration) bool {
	lastPoll := ct.incomings.LastCount()
	if lastPoll == nil {
		// NOTE: Meaning that we don't get any poll requests yet
		return false
	}

	return time.Now().Add(-past).After(*lastPoll)
}

// NOTE: This function gives a number from [0, 1] denoting how soon the client
// should make next request. Zero implies maximal delay, one - minimal delay.
func (ct *ChannelTimings) getNormalizedDelayFactor() float64 {
	factor := ct.currentPollDelayFactor
	oRate := ct.outgoings.Rate()
	opRate := ct.outgoingPayloads.Rate()
	iRate := ct.incomings.Rate()

	if f64Equals(oRate, 0.0) || f64Equals(iRate, 0.0) {
		return 1.0
	}

	isSynchronousStream := false
	if math.Abs(oRate/iRate-1.0) < 0.1 {
		isSynchronousStream = true
	}

	var targetFactor float64
	if isSynchronousStream && !f64Equals(opRate, 0.0) {
		// NOTE: Use real speed of producing outgoing payloads
		opDelay := 1000 / opRate
		targetFactor = keepNormalized(ct.clientPollDelayCurve.Invert(opDelay))
	} else {
		oDelay := 1000 / oRate
		targetFactor = keepNormalized(ct.clientPollDelayCurve.Invert(oDelay))
	}

	// NOTE: It's better to approch target rate at proper pace, without
	// fast and bug jumps
	factor = keepNormalized(0.2*factor + 0.8*targetFactor)

	if math.Abs(factor-targetFactor) < 0.01 {
		factor = targetFactor
	}

	return factor
}

func f64Equals(lhs, rhs float64) bool {
	return math.Abs(lhs-rhs) <= 1e-9
}

func keepNormalized(v float64) float64 {
	return math.Max(0.0, math.Min(v, 1.0))
}
