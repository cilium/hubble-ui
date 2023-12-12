package channel

import (
	"context"
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	protobuf "google.golang.org/protobuf/proto"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/message"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/timings"
)

var (
	ErrChannelClosed = errors.New("channel closed")
)

type ChannelHandler func(*Channel) error
type ChannelMiddleware interface {
	Clone() ChannelMiddleware
	RunBeforePolling(*Channel, *message.Message) error
}

type Channel struct {
	Id string

	shutdownContext context.Context
	ctx             context.Context
	cancel          context.CancelCauseFunc

	// NOTE: Only one thread can mutate channel's state at a time
	mx      sync.RWMutex
	msgs    *message.Messages
	timings *timings.ChannelTimings

	closed    chan struct{}
	closeOnce sync.Once

	handlerTerminated    bool
	handlerErr           error
	handlerData          interface{}
	handlerDataUpdatedCh chan interface{}

	middlewares []ChannelMiddleware

	prioritizedCookies []*http.Cookie
}

func (ch *Channel) IsStaleDuration(past time.Duration) bool {
	return ch.timings.IsStaleDuration(past)
}

func (ch *Channel) AddPrioritizedCookies(cookies []*http.Cookie) error {
	ch.mx.Lock()
	defer ch.mx.Unlock()

	if ch.IsClosed() {
		return ErrChannelClosed
	}

	ch.prioritizedCookies = append(ch.prioritizedCookies, cookies...)
	return nil
}

func (ch *Channel) PickPriorityCookies() []*http.Cookie {
	ch.mx.Lock()
	defer ch.mx.Unlock()

	return ch.prioritizedCookies
}

func (ch *Channel) PopPriorityCookies() []*http.Cookie {
	ch.mx.Lock()
	defer ch.mx.Unlock()

	cookies := ch.prioritizedCookies
	ch.prioritizedCookies = nil

	return cookies
}

// NOTE: This method could also return smth else besides cookies...
func (ch *Channel) PopPriorityData() []*http.Cookie {
	return ch.PopPriorityCookies()
}

func (ch *Channel) RunMiddlewares(msg *message.Message) error {
	// NOTE: We don't need lock here, since we run the middleware code
	// which can execute other locking actions on Channel
	for _, mw := range ch.middlewares {
		if mw == nil {
			continue
		}

		if err := mw.RunBeforePolling(ch, msg); err != nil {
			return err
		}
	}

	return nil
}

func (ch *Channel) HandlerData() interface{} {
	ch.mx.RLock()
	defer ch.mx.RUnlock()

	return ch.handlerData
}

func (ch *Channel) SetHandlerData(hd interface{}) error {
	ch.mx.Lock()
	ch.handlerData = hd

	if ch.handlerDataUpdatedCh == nil {
		ch.handlerDataUpdatedCh = make(chan interface{}, 1)
	}

	ch.mx.Unlock()

	select {
	case <-ch.ctx.Done():
		return context.Canceled
	case <-ch.Closed():
		return context.Canceled
	case <-ch.Shutdown():
		return context.Canceled
	case ch.handlerDataUpdatedCh <- hd:
	default:
	}

	return nil
}

func (ch *Channel) HandlerDataUpdated() <-chan interface{} {
	ch.mx.Lock()
	defer ch.mx.Unlock()

	if ch.handlerDataUpdatedCh == nil {
		ch.handlerDataUpdatedCh = make(chan interface{}, 1)
	}

	return ch.handlerDataUpdatedCh
}

func (ch *Channel) Incomings() <-chan *message.Message {
	return ch.msgs.Incomings(ch.ctx)
}

func (ch *Channel) CountOutgoing() {
	ch.timings.CountOutgoingMessage()
}

func (ch *Channel) SendCookies(cookies []*http.Cookie) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	// NOTE: It's very important to send such non-content messages with
	// NotReady set to true, to let client think that another poll request
	// is required
	msgb := ch.ResponseBuilder().WithNotReady(true)
	for _, cookie := range cookies {
		msgb.WithResponseCookie(cookie)
	}

	return ch.EnqueueOutgoing(ch.ctx, msgb)
}

func (ch *Channel) Send(b []byte) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	msgb := ch.ResponseBuilder().WithBodyBytes(b)
	return ch.EnqueueOutgoing(ch.ctx, msgb)
}

func (ch *Channel) SendProto(p protobuf.Message) error {
	bytes, err := protobuf.Marshal(p)
	if err != nil {
		return err
	}

	return ch.Send(bytes)
}

func (ch *Channel) SendProtoNonblock(p protobuf.Message) error {
	bytes, err := protobuf.Marshal(p)
	if err != nil {
		return err
	}

	return ch.SendNonblock(bytes)
}

func (ch *Channel) TerminateProto(p protobuf.Message) error {
	bytes, err := protobuf.Marshal(p)
	if err != nil {
		return err
	}

	return ch.Terminate(bytes)
}

func (ch *Channel) TerminateProtoNonblock(p protobuf.Message) error {
	bytes, err := protobuf.Marshal(p)
	if err != nil {
		return err
	}

	return ch.TerminateNonblock(bytes)
}

func (ch *Channel) SendNonblock(b []byte) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	msgb := ch.ResponseBuilder().WithBodyBytes(b)
	return ch.EnqueueOutgoingNonblock(msgb)
}

func (ch *Channel) Terminate(b []byte) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	msgb := ch.ResponseBuilder().WithBodyBytes(b).WithTerminated(true)
	return ch.EnqueueOutgoing(ch.ctx, msgb)
}

func (ch *Channel) TerminateNonblock(b []byte) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	msgb := ch.ResponseBuilder().WithBodyBytes(b).WithTerminated(true)
	return ch.EnqueueOutgoingNonblock(msgb)
}

func (ch *Channel) TerminateStatus(code int) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	msgb := ch.ResponseBuilder().WithTerminated(true).WithStatusCode(code)
	return ch.EnqueueOutgoing(ch.ctx, msgb)
}

func (ch *Channel) TerminateStatusNonblock(code int) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	msgb := ch.ResponseBuilder().WithTerminated(true).WithStatusCode(code)
	return ch.EnqueueOutgoingNonblock(msgb)
}

func (ch *Channel) EnqueueOutgoing(
	ctx context.Context,
	msgb message.MessageBuilder,
) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	ch.countOutgoingMessage(&msgb)
	return ch.msgs.EnqueueOutgoing(ctx, msgb)
}

func (ch *Channel) EnqueueOutgoingNonblock(msgb message.MessageBuilder) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	ch.countOutgoingMessage(&msgb)
	ch.msgs.EnqueueOutgoingNonblock(msgb)
	return nil
}

func (ch *Channel) Receive() (*message.Message, error) {
	if ch.IsClosed() {
		return nil, ErrChannelClosed
	}

	return ch.msgs.DequeueIncoming(ch.ctx)
}

func (ch *Channel) ReceiveNonblock() (*message.Message, error) {
	if ch.msgs.IncomingsSize() == 0 && ch.IsClosed() {
		return nil, ErrChannelClosed
	}

	return ch.msgs.DequeueIncomingNonblock(), nil
}

func (ch *Channel) EnqueueIncomingNonblock(msg *message.Message) error {
	if ch.IsClosed() {
		return ErrChannelClosed
	}

	ch.countIncomingMessage(msg)
	ch.msgs.EnqueueIncomingNonblock(msg)
	return nil
}

func (ch *Channel) DequeueOutgoingNonblock() (*message.MessageBuilder, error) {
	if ch.msgs.OutgoingsSize() == 0 && ch.IsClosed() {
		return nil, ErrChannelClosed
	}

	return ch.msgs.DequeueOutgoingNonblock(), nil
}

func (ch *Channel) DequeueOutgoingTimeout(timeout time.Duration) (
	*message.MessageBuilder, error,
) {
	if ch.msgs.OutgoingsSize() == 0 && ch.IsClosed() {
		return nil, ErrChannelClosed
	}

	return ch.msgs.DequeueOutgoingTimeout(ch.ctx, timeout)
}

func (ch *Channel) PeekIncoming() (*message.Message, error) {
	if ch.msgs.IncomingsSize() == 0 && ch.IsClosed() {
		return nil, ErrChannelClosed
	}

	return ch.msgs.PeekIncoming(), nil
}

func (ch *Channel) AwaitHandler(handlerFn ChannelHandler) {
	err := handlerFn(ch)

	ch.mx.Lock()
	defer ch.mx.Unlock()

	ch.handlerTerminated = true
	ch.handlerErr = err
	ch.Close()
}

func (ch *Channel) GetClientPollDelay() time.Duration {
	return ch.timings.ClientPollDelay(
		ch.msgs.OutgoingsSize(),
	)
}

func (ch *Channel) ResponseBuilder() message.MessageBuilder {
	return message.Builder().WithChannelId(ch.Id)
}

func (ch *Channel) Close() {
	ch.closeOnce.Do(func() {
		close(ch.closed)
		ch.cancel(ErrChannelClosed)
	})
}

func (ch *Channel) TerminationStatus() (bool, error) {
	ch.mx.Lock()
	defer ch.mx.Unlock()

	return ch.handlerTerminated, ch.handlerErr
}

func (ch *Channel) HasNoOutgoingMessages() bool {
	return ch.msgs.OutgoingsSize() == 0
}

func (ch *Channel) Closed() <-chan struct{} {
	return ch.closed
}

func (ch *Channel) IsClosed() bool {
	select {
	case <-ch.closed:
		return true
	default:
		return false
	}
}

func (ch *Channel) Shutdown() <-chan struct{} {
	return ch.shutdownContext.Done()
}

func (ch *Channel) Context() context.Context {
	return ch.ctx
}

func (ch *Channel) LogFields() logrus.Fields {
	ch.mx.Lock()
	defer ch.mx.Unlock()

	return logrus.Fields{
		"channelId":         ch.Id,
		"isClosed":          ch.IsClosed(),
		"handlerTerminated": ch.handlerTerminated,
		"handlerErr":        ch.handlerErr,
	}
}

func (ch *Channel) countIncomingMessage(msg *message.Message) {
	ch.timings.CountIncomingMessage()
	if msg.IsPoll() {
		return
	}

	ch.timings.CountIncomingPayload()
}

func (ch *Channel) countOutgoingMessage(msg *message.MessageBuilder) {
	ch.timings.CountOutgoingMessage()
	if msg.IsPoll() {
		return
	}

	ch.timings.CountOutgoingPayload()
}
