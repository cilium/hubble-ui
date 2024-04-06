package router

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/route"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/timings"
	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"
)

type CPBuilder struct {
	log         logrus.FieldLogger
	baseContext context.Context

	// NOTE: Number of bytes used for generating TraceId / ChannelId hashes
	tidBytesNumber int
	cidBytesNumber int

	timingsBuilder timings.RouterTimingsBuilder
}

func Builder() CPBuilder {
	return CPBuilder{}
}

func (b CPBuilder) WithLogger(log logrus.FieldLogger) CPBuilder {
	b.log = log
	return b
}

func (b CPBuilder) WithBaseContext(ctx context.Context) CPBuilder {
	b.baseContext = ctx
	return b
}

func (b CPBuilder) WithTraceIdBytesNumber(n int) CPBuilder {
	b.tidBytesNumber = n
	return b
}

func (b CPBuilder) WithChannelIdBytesNumber(n int) CPBuilder {
	b.cidBytesNumber = n
	return b
}

func (b CPBuilder) WithClientPollDelays(min, max time.Duration) CPBuilder {
	b.timingsBuilder = b.timingsBuilder.
		WithMinClientPollDelay(min).
		WithMaxClientPollDelay(max)

	return b
}

func (b CPBuilder) WithGarbageCollectionDelay(d time.Duration) CPBuilder {
	b.timingsBuilder = b.timingsBuilder.WithGarbageCollectionDelay(d)
	return b
}

func (b CPBuilder) WithRouteResumePollTimeout(t time.Duration) CPBuilder {
	b.timingsBuilder = b.timingsBuilder.WithRouteResumePollDelay(t)
	return b
}

func (b CPBuilder) Build() (*Router, error) {
	if b.log == nil {
		return nil, b.err("log")
	}

	if b.baseContext == nil {
		return nil, b.err("baseContext")
	}

	routerTimings, err := b.timingsBuilder.Build()
	if err != nil {
		return nil, errors.Wrapf(err, "failed to build Router")
	}

	tidBytesDefault := 8
	if b.tidBytesNumber == 0 {
		b.log.
			WithField("default", tidBytesDefault).
			Warn("TraceId bytes number is not set, using default value")

		b.tidBytesNumber = tidBytesDefault
	}

	cidBytesDefault := 8
	if b.cidBytesNumber == 0 {
		b.log.
			WithField("default", cidBytesDefault).
			Warn("ChannelId bytes number is not set, using default value")

		b.cidBytesNumber = cidBytesDefault
	}

	return &Router{
		log:            b.log,
		baseContext:    b.baseContext,
		tidBytesNumber: b.tidBytesNumber,
		cidBytesNumber: b.cidBytesNumber,
		timings:        routerTimings,
		routes:         make(route.Routes),
		gcOnce:         sync.Once{},
	}, nil
}

func (b CPBuilder) err(what string) error {
	return fmt.Errorf(
		"failed to build custom protocol Router: %s is not set",
		what,
	)
}
