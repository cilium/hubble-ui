package route

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/channel"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/message"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/timings"
)

type RouteKind string

// NOTE: There is no further division if stream is uni- or bidirectional
const (
	OneshotKind RouteKind = "oneshot"
	StreamKind  RouteKind = "stream"
)

type RouteHandler func(*channel.Channel) error
type RouteMiddleware func(*channel.Channel, *message.Message) (bool, error)

type Route struct {
	log         *slog.Logger
	kind        RouteKind
	name        string
	baseContext context.Context

	timings  *timings.RouterTimings
	channels *channel.Channels

	middlewares []channel.ChannelMiddleware
	handler     RouteHandler
}

func (r *Route) Poll(ctx context.Context, msg *message.Message) (
	*message.Message, error,
) {
	if r.isStream() {
		return r.resumeStream(ctx, msg)
	}

	return r.resumeOneshot(ctx, msg)
}

// NOTE: In theory we can have all the cases how stream is working:
// * It sends outgoing messages but doesn't read incoming ones
// * It reads incoming messages but doesn't send anything back
// * It both reads incoming and sends outgoing messages
func (r *Route) resumeStream(
	_ctx context.Context, msg *message.Message,
) (*message.Message, error) {
	ch, isNew, err := r.getChannel(msg)

	if err != nil {
		return nil, err
	}

	if err := ch.RunMiddlewares(msg.SetAsOpening(isNew)); err != nil {
		return nil, err
	}

	// NOTE: All other incoming messages are preserved
	if err = ch.EnqueueIncomingNonblock(msg); err != nil {
		// NOTE: ErrChannelClosed is critical only when route handler wants to use
		// closed channel
		if !errors.Is(err, channel.ErrChannelClosed) {
			return nil, err
		}
	}

	if isNew {
		go ch.AwaitHandler(channel.ChannelHandler(r.handler))
	}

	return r.pollChannel(ch, msg)
}

func (r *Route) resumeOneshot(
	_ctx context.Context, msg *message.Message,
) (*message.Message, error) {
	ch, isNew, err := r.getChannel(msg)
	if err != nil {
		return nil, err
	}

	if err := ch.RunMiddlewares(msg.SetAsOpening(isNew)); err != nil {
		return nil, err
	}

	// NOTE: Only the first message is preserved
	if isNew {
		if err := ch.EnqueueIncomingNonblock(msg); err != nil {
			if !errors.Is(err, channel.ErrChannelClosed) {
				return nil, err
			}
		}

		go ch.AwaitHandler(channel.ChannelHandler(r.handler))
	}

	return r.pollChannel(ch, msg)
}

func (r *Route) pollChannel(
	ch *channel.Channel,
	msg *message.Message,
) (*message.Message, error) {
	var (
		respptr               *message.MessageBuilder
		err                   error
		outgoingExists        bool
		handlerWannaTerminate bool
	)

	if msg.IsTerminated() {
		r.log.Debug("client sent terminating message", msg.LogAttrs()...)

		ch.Close()
		r.dropChannel(ch)

		return ch.ResponseBuilder().
			WithTraceId(msg.TraceId()).
			WithRouteName(r.name).
			WithTerminated(true).
			WithStatusCode(http.StatusOK).
			Build()
	}

	if pollTimeout := r.timings.RouteResumePollTimeout; pollTimeout == 0 {
		respptr, err = ch.DequeueOutgoingNonblock()
	} else {
		respptr, err = ch.DequeueOutgoingTimeout(pollTimeout)
	}

	outgoingExists = respptr != nil
	handlerWannaTerminate = respptr != nil && respptr.IsTerminated()

	isTerminated, handlerErr := ch.TerminationStatus()
	if respptr == nil {
		b := ch.ResponseBuilder()
		respptr = &b
	}

	terminatedFlag := isTerminated || handlerWannaTerminate
	// NOTE: If termination error occurred, let user poll outgoing message first
	// and that error in the second poll request
	isEmpty := ch.HasNoOutgoingMessages() && handlerErr == nil

	logAttrs := []any{
		"isTerminated", terminatedFlag,
		"handlerWannaTerminate", handlerWannaTerminate,
		"handlerErr", handlerErr,
		"isEmpty", isEmpty,
		"outgoingExists", outgoingExists,
		"respptr.IsNotReady", respptr.IsPoll(),
	}

	cookies := ch.PopPriorityData()

	resp := respptr.
		WithTraceId(msg.TraceId()).
		WithChannelId(ch.Id).
		WithTerminated(terminatedFlag).
		WithRouteName(r.name).
		WithNotReady(respptr.IsPoll() || !outgoingExists).
		WithStatusCodePtr(respptr.StatusCode()).
		WithEmpty(isEmpty).
		WithResponseCookies(cookies)

		// NOTE: Termination error will only be sent if there is no produced msg
	if handlerErr != nil && !outgoingExists {
		if !errors.Is(handlerErr, channel.ErrChannelClosed) {
			// NOTE: Since the error is about to be sent, mark channel as empty
			resp = resp.WithError(handlerErr).WithEmpty(true)
			logAttrs = append(logAttrs, "resp.isEmpty", true)
		}
	}

	switch {
	case errors.Is(err, context.Canceled):
		r.log.Debug("context cancelled", append(logAttrs, "error", err)...)
		return nil, context.Canceled
	case errors.Is(err, context.DeadlineExceeded):
		resp = resp.WithNotReady(true)
	case errors.Is(err, channel.ErrChannelClosed):
		resp = resp.WithTerminated(true)
	case err != nil:
		resp = resp.WithNotReady(true).WithTerminated(true).WithError(err)
	}

	logAttrs = append(logAttrs,
		"resp.isNotReady", resp.IsPoll(),
		"resp.isTerminated", resp.IsTerminated(),
		"resp.Errors", resp.Errors(),
		"size-of-resp.ResponseCookies", len(cookies))

	respMsg, err := resp.WithPollDelay(ch.GetClientPollDelay()).Build()
	if respMsg != nil && respMsg.IsTerminated() && respMsg.IsEmpty() {
		r.log.Debug("closing and dropping channel", logAttrs...)

		ch.Close()
		r.dropChannel(ch)
	}

	// NOTE: Every incoming message participates in incrementing incoming rate
	// counter. This call does the same job but for outgoings rate counter.
	if respMsg.IsPoll() {
		ch.CountOutgoing()
	}

	return respMsg, err
}

// NOTE: This is a main method that maps message to corresponding Channel
// TODO: Make channels map thread safe
func (r *Route) getChannel(msg *message.Message) (
	*channel.Channel, bool, error,
) {
	r.channels.Lock()
	defer r.channels.Unlock()

	cid := msg.ChannelId()
	existing, ok := r.channels.GetByIdUnsafe(cid)
	if ok {
		return existing, false, nil
	}

	chTimings, err := r.timings.ChannelTimings()
	if err != nil {
		return nil, false, err
	}

	newch, err := channel.Builder().
		WithId(cid).
		WithShutdownContext(r.baseContext).
		WithTimings(chTimings).
		WithMiddlewares(r.cloneMiddlewares()).
		Build()

	if err != nil {
		return nil, false, err
	}

	r.channels.SetByIdUnsafe(newch)
	return newch, true, nil
}

func (r *Route) cloneMiddlewares() []channel.ChannelMiddleware {
	mws := make([]channel.ChannelMiddleware, 0, len(r.middlewares))

	for _, mw := range r.middlewares {
		mws = append(mws, mw.Clone())
	}

	return mws
}

func (r *Route) dropChannel(ch *channel.Channel) {
	r.channels.Drop(ch)
}

func (r *Route) Middlewares(mws []channel.ChannelMiddleware) *Route {
	r.middlewares = mws
	return r
}

func (r *Route) Oneshot(h RouteHandler) *Route {
	r.kind = OneshotKind
	r.handler = h

	return r
}

func (r *Route) Stream(h RouteHandler) *Route {
	r.kind = StreamKind
	r.handler = h

	return r
}

func (r *Route) CloseAndDropStaleChannels(past time.Duration) uint {
	return r.channels.CloseAndDropStale(past)
}

func (r *Route) isStream() bool {
	return r.kind == StreamKind
}
