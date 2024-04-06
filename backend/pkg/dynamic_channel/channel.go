package dchannel

import (
	"context"
	"sync"

	"github.com/cilium/hubble-ui/backend/pkg/deque"
)

type claim[T any] struct {
	ready   chan struct{}
	invalid chan struct{}
	datum   T
}

// TODO: Need to find a way to use Deque[claim] instead of Deque[*claim]
type DynamicChannel[T any] struct {
	mx     *sync.RWMutex
	supply *deque.Deque[*claim[T]]
	demand *deque.Deque[*claim[T]]
}

func New[T any]() *DynamicChannel[T] {
	return &DynamicChannel[T]{
		mx:     new(sync.RWMutex),
		supply: deque.New[*claim[T]](0),
		demand: deque.New[*claim[T]](0),
	}
}

func NewWithMutex[T any](mx *sync.RWMutex) *DynamicChannel[T] {
	return &DynamicChannel[T]{
		mx:     mx,
		supply: deque.New[*claim[T]](0),
		demand: deque.New[*claim[T]](0),
	}
}

func AsOutputChannel[T any](
	ch *DynamicChannel[T],
) (chan T, func(context.Context)) {
	outputCh := make(chan T)

	return outputCh, func(ctx context.Context) {
		for {
			d, err := ch.Dequeue(ctx)
			if err != nil {
				break
			}

			if d == nil {
				continue
			}

			select {
			case <-ctx.Done():
			case outputCh <- *d:
			}
		}
	}
}

func (dch *DynamicChannel[T]) Slice() []T {
	dch.mx.RLock()
	defer dch.mx.RUnlock()

	d := make([]T, dch.supply.Size())

	for i := 0; i < len(d); i += 1 {
		cl := dch.supply.Get(uint(i))
		d[len(d)-1-i] = (*cl).datum
	}

	return d
}

func (dch *DynamicChannel[T]) Enqueue(ctx context.Context, d T) error {
	dch.mx.Lock()
	for {
		if dch.demand.Size() == 0 {
			break
		}

		w := *dch.demand.Pop()
		w.datum = d
		dch.mx.Unlock()

		select {
		case <-ctx.Done():
			return context.Cause(ctx)
		case <-w.invalid:
		case w.ready <- struct{}{}:
			return nil
		}

		dch.mx.Lock()
	}

	w := &claim[T]{
		datum:   d,
		ready:   make(chan struct{}),
		invalid: make(chan struct{}),
	}

	dch.supply.PushBack(w)
	dch.mx.Unlock()

	select {
	case <-ctx.Done():
		w.invalidate()
		return context.Cause(ctx)
	case <-w.ready:
		return nil
	}
}

func (dch *DynamicChannel[T]) EnqueueNonblock(d T) {
	dch.mx.Lock()

	for {
		if dch.demand.Size() == 0 {
			break
		}

		w := *dch.demand.Pop()
		w.datum = d
		dch.mx.Unlock()

		select {
		case <-w.invalid:
		default:
			close(w.ready)
			return
		}

		dch.mx.Lock()
	}

	w := &claim[T]{
		datum:   d,
		ready:   nil,
		invalid: nil,
	}

	dch.supply.PushBack(w)
	dch.mx.Unlock()
}

func (dch *DynamicChannel[T]) Dequeue(ctx context.Context) (*T, error) {
	dch.mx.Lock()

	for {
		if dch.supply.Size() == 0 {
			break
		}

		c := *dch.supply.Pop()
		dch.mx.Unlock()

		if c.ready == nil {
			return &c.datum, nil
		}

		select {
		case <-ctx.Done():
			return nil, context.Cause(ctx)
		case <-c.invalid:
		case c.ready <- struct{}{}:
			return &c.datum, nil
		}

		dch.mx.Lock()
	}

	w := &claim[T]{
		ready:   make(chan struct{}),
		invalid: make(chan struct{}),
	}

	dch.demand.PushBack(w)
	dch.mx.Unlock()

	select {
	case <-ctx.Done():
		w.invalidate()
		return nil, context.Cause(ctx)
	case <-w.ready:
		return &w.datum, nil
	}
}

func (dch *DynamicChannel[T]) DequeueNonblock() *T {
	dch.mx.Lock()

	for {
		if dch.supply.Size() == 0 {
			break
		}

		c := *dch.supply.Pop()
		dch.mx.Unlock()

		if c.ready == nil {
			return &c.datum
		}

		select {
		case <-c.invalid:
			dch.mx.Lock()
			continue
		case c.ready <- struct{}{}:
		default:
		}

		return &c.datum
	}

	dch.mx.Unlock()
	return nil
}

func (dch *DynamicChannel[T]) Peek() *T {
	dch.mx.RLock()
	defer dch.mx.RUnlock()

	elem := dch.supply.Peek()
	if elem == nil {
		return nil
	}

	return &(*elem).datum
}

func (dch *DynamicChannel[T]) Size() uint {
	dch.mx.RLock()
	defer dch.mx.RUnlock()

	return dch.supply.Size()
}

func (c *claim[T]) isInvalid() bool {
	select {
	case <-c.invalid:
		return true
	default:
		return false
	}
}

func (c *claim[T]) invalidate() {
	if c.isInvalid() {
		return
	}

	close(c.invalid)
}
