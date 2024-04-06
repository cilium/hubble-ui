package route

import (
	"context"
	"fmt"
	"time"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/channel"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/timings"
	"github.com/sirupsen/logrus"
)

type RouteBuilder struct {
	kind                       RouteKind
	name                       string
	log                        logrus.FieldLogger
	baseContext                context.Context
	defaultHandler             RouteHandler
	outgoingMessagePollTimeout time.Duration
	timings                    *timings.RouterTimings
}

func Builder() RouteBuilder {
	return RouteBuilder{}
}

func (b RouteBuilder) WithKind(k RouteKind) RouteBuilder {
	b.kind = k
	return b
}

func (b RouteBuilder) WithName(n string) RouteBuilder {
	b.name = n
	return b
}

func (b RouteBuilder) WithBaseContext(ctx context.Context) RouteBuilder {
	b.baseContext = ctx
	return b
}

func (b RouteBuilder) WithDefaultHandler(h RouteHandler) RouteBuilder {
	b.defaultHandler = h
	return b
}

func (b RouteBuilder) WithOutgoingMessagePollTimeout(t time.Duration) RouteBuilder {
	b.outgoingMessagePollTimeout = t
	return b
}

func (b RouteBuilder) WithTimings(t *timings.RouterTimings) RouteBuilder {
	b.timings = t
	return b
}

func (b RouteBuilder) WithLogger(log logrus.FieldLogger) RouteBuilder {
	b.log = log
	return b
}

func (b RouteBuilder) Build() (*Route, error) {
	if b.baseContext == nil {
		b.baseContext = context.Background()
	}

	if b.log == nil {
		return nil, b.err("logger")
	}

	if len(b.kind) == 0 {
		return nil, b.err("kind")
	}

	if b.timings == nil {
		return nil, b.err("timings")
	}

	if b.defaultHandler == nil {
		return nil, b.err("defaultHandler")
	}

	route := &Route{
		kind:        b.kind,
		log:         b.log,
		name:        b.name,
		baseContext: b.baseContext,
		handler:     b.defaultHandler,
		channels:    channel.NewChannels(),
		timings:     b.timings,
	}

	return route, nil
}

func (b RouteBuilder) err(what string) error {
	return fmt.Errorf("failed to build Route: %s is not set", what)
}
