package message

import (
	"context"
	"sync"
	"time"

	dchannel "github.com/cilium/hubble-ui/backend/pkg/dynamic_channel"
)

type Messages struct {
	// NOTE: This mutex belongs to enclosing Channel
	pmx *sync.RWMutex

	incomings *dchannel.DynamicChannel[*Message]
	outgoings *dchannel.DynamicChannel[MessageBuilder]

	incomingsCh chan *Message
}

func NewMessages(parentMx *sync.RWMutex) *Messages {
	// NOTE: parentMx can also be passed inside of dynamic channels
	return &Messages{
		pmx:       parentMx,
		incomings: dchannel.NewWithMutex[*Message](parentMx),
		outgoings: dchannel.NewWithMutex[MessageBuilder](parentMx),
	}
}

func (m *Messages) Incomings(ctx context.Context) <-chan *Message {
	m.pmx.Lock()
	defer m.pmx.Unlock()

	if m.incomingsCh != nil {
		return m.incomingsCh
	}

	incomingsCh, readerFn := dchannel.AsOutputChannel(m.incomings)
	go readerFn(ctx)
	m.incomingsCh = incomingsCh

	return m.incomingsCh
}

func (m *Messages) EnqueueOutgoing(
	ctx context.Context,
	msgb MessageBuilder,
) error {
	return m.outgoings.Enqueue(ctx, msgb)
}

func (m *Messages) EnqueueOutgoingTimeout(
	msgb MessageBuilder,
	timeout time.Duration,
) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	return m.EnqueueOutgoing(ctx, msgb)
}

func (m *Messages) EnqueueOutgoingNonblock(msgb MessageBuilder) {
	m.outgoings.EnqueueNonblock(msgb)
}

func (m *Messages) DequeueOutgoing(ctx context.Context) (*MessageBuilder, error) {
	msg, err := m.outgoings.Dequeue(ctx)
	if err != nil {
		return nil, err
	}

	if msg == nil {
		return nil, nil
	}

	return msg, nil
}

func (m *Messages) DequeueOutgoingNonblock() *MessageBuilder {
	return m.outgoings.DequeueNonblock()
}

func (m *Messages) DequeueOutgoingTimeout(
	parent context.Context,
	timeout time.Duration,
) (
	*MessageBuilder, error,
) {
	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	return m.DequeueOutgoing(ctx)
}

func (m *Messages) EnqueueIncoming(ctx context.Context, msg *Message) error {
	return m.incomings.Enqueue(ctx, msg)
}

func (m *Messages) EnqueueIncomingNonblock(msg *Message) {
	m.incomings.EnqueueNonblock(msg)
}

func (m *Messages) EnqueueIncomingTimeout(
	parent context.Context,
	msg *Message,
	timeout time.Duration,
) error {
	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	return m.EnqueueIncoming(ctx, msg)
}

func (m *Messages) DequeueIncoming(ctx context.Context) (*Message, error) {
	msg, err := m.incomings.Dequeue(ctx)
	if err != nil {
		return nil, err
	}

	if msg == nil {
		return nil, nil
	}

	return *msg, nil
}

func (m *Messages) DequeueIncomingNonblock() *Message {
	msg := m.incomings.DequeueNonblock()
	if msg == nil {
		return nil
	}

	return *msg
}

func (m *Messages) DequeueIncomingTimeout(
	parent context.Context,
	timeout time.Duration,
) (*Message, error) {
	ctx, cancel := context.WithTimeout(parent, timeout)
	defer cancel()

	return m.DequeueIncoming(ctx)
}

func (m *Messages) PeekIncoming() *Message {
	msg := m.incomings.Peek()
	if msg == nil {
		return nil
	}

	return *msg
}

func (m *Messages) OutgoingsSize() uint {
	return m.outgoings.Size()
}

func (m *Messages) IncomingsSize() uint {
	return m.incomings.Size()
}
