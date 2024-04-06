package channel

import (
	"context"
	"fmt"
	"sync"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/message"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/timings"
)

type ChannelBuilder struct {
	id          string
	shutdownCtx context.Context
	timings     *timings.ChannelTimings
	middlewares []ChannelMiddleware
}

func Builder() ChannelBuilder {
	return ChannelBuilder{}
}

func (b ChannelBuilder) WithId(id string) ChannelBuilder {
	b.id = id
	return b
}

func (b ChannelBuilder) WithShutdownContext(ctx context.Context) ChannelBuilder {
	b.shutdownCtx = ctx
	return b
}

func (b ChannelBuilder) WithTimings(t *timings.ChannelTimings) ChannelBuilder {
	b.timings = t
	return b
}

func (b ChannelBuilder) WithMiddlewares(mws []ChannelMiddleware) ChannelBuilder {
	b.middlewares = mws
	return b
}

func (b ChannelBuilder) Build() (*Channel, error) {
	if b.shutdownCtx == nil {
		return nil, b.err("shutdownCtx")
	}

	if len(b.id) == 0 {
		return nil, b.err("id")
	}

	middlewares := make([]ChannelMiddleware, len(b.middlewares))
	copy(middlewares, b.middlewares)

	ctx, cancel := context.WithCancelCause(b.shutdownCtx)

	ch := &Channel{
		Id:              b.id,
		shutdownContext: b.shutdownCtx,
		ctx:             ctx,
		cancel:          cancel,
		mx:              sync.RWMutex{},
		msgs:            nil,
		timings:         b.timings,
		closed:          make(chan struct{}),
		closeOnce:       sync.Once{},
		middlewares:     middlewares,
	}

	msgs := message.NewMessages(&ch.mx)
	ch.msgs = msgs

	return ch, nil
}

func (b ChannelBuilder) err(what string) error {
	return fmt.Errorf("failed to build Channel: %s is not set", what)
}
