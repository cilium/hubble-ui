package timings

import (
	"fmt"
	"time"
)

type RouterTimingsBuilder struct {
	routeResumePollTimeout time.Duration
	minClientPollDelay     time.Duration
	maxClientPollDelay     time.Duration
	gcDelay                time.Duration
}

func (b RouterTimingsBuilder) WithRouteResumePollDelay(
	d time.Duration,
) RouterTimingsBuilder {
	b.routeResumePollTimeout = d
	return b
}

func (b RouterTimingsBuilder) WithMinClientPollDelay(
	d time.Duration,
) RouterTimingsBuilder {
	b.minClientPollDelay = d
	return b
}

func (b RouterTimingsBuilder) WithMaxClientPollDelay(
	d time.Duration,
) RouterTimingsBuilder {
	b.maxClientPollDelay = d
	return b
}

func (b RouterTimingsBuilder) WithGarbageCollectionDelay(d time.Duration) RouterTimingsBuilder {
	b.gcDelay = d
	return b
}

func (b RouterTimingsBuilder) Build() (*RouterTimings, error) {
	if b.minClientPollDelay == 0 {
		return nil, b.err("minClientPollDelay")
	}

	if b.maxClientPollDelay == 0 {
		return nil, b.err("maxClientPollDelay")
	}

	return &RouterTimings{
		RouteResumePollTimeout: b.routeResumePollTimeout,
		clientPollMin:          b.minClientPollDelay,
		clientPollMax:          b.maxClientPollDelay,
		GarbageCollectionDelay: b.gcDelay,
	}, nil
}

func (b *RouterTimingsBuilder) err(what string) error {
	return fmt.Errorf("failed to build RouterTimings: '%s' is not sea", what)
}
