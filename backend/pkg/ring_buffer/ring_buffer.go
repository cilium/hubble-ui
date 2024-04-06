package ring_buffer

import (
	"fmt"
	"sync/atomic"
)

type RingBuffer[T any] struct {
	buffer []T
	start  atomic.Int64
	n      atomic.Int64
}

func New[T any](capacity uint) *RingBuffer[T] {
	return &RingBuffer[T]{
		buffer: make([]T, capacity),
		start:  atomic.Int64{},
		n:      atomic.Int64{},
	}
}

func (rb *RingBuffer[T]) Push(elem T) {
	ptr := rb.getPushPointer()
	if ptr == nil {
		return
	}

	*ptr = elem
}

func (rb *RingBuffer[T]) PushUpdate(fn func(*T)) {
	ptr := rb.getPushPointer()
	if ptr == nil {
		return
	}

	fn(ptr)
}

func (rb *RingBuffer[T]) Pop() *T {
	for {
		n := rb.n.Load()
		if n == 0 {
			return nil
		}

		start := rb.start.Load()
		ridx := (start + n - 1) % int64(cap(rb.buffer))

		if !rb.n.CompareAndSwap(n, n-1) {
			continue
		}

		elem := rb.buffer[ridx]
		return &elem
	}
}

func (rb *RingBuffer[T]) Get(idx int) *T {
	c := int64(len(rb.buffer))
	if c == 0 || rb.n.Load() == 0 {
		return nil
	}

	for idx < 0 {
		idx += int(c)
	}

	for {
		start := rb.start.Load()
		ridx := (start + int64(idx)) % c

		if rb.start.Load() == start {
			return &rb.buffer[ridx]
		}
	}
}

func (rb *RingBuffer[T]) GetFirst() *T {
	return rb.Get(0)
}

func (rb *RingBuffer[T]) GetLast() *T {
	if len(rb.buffer) == 0 || rb.n.Load() == 0 {
		return nil
	}

	for {
		start := rb.start.Load()
		n := rb.n.Load()

		lastIdx := (start + n - 1) % int64(len(rb.buffer))
		if start == rb.start.Load() && n == rb.n.Load() {
			return &rb.buffer[lastIdx]
		}
	}
}

func (rb *RingBuffer[T]) ReverseIterate(fn func(*T) bool) {
	if len(rb.buffer) == 0 || rb.n.Load() == 0 {
		return
	}

	c := int64(len(rb.buffer))
	endIdx := (rb.start.Load() + rb.n.Load() - 1) % c

	for idx := endIdx; ; idx = (c + idx - 1) % c {
		if fn(&rb.buffer[idx]) {
			break
		}

		if idx == rb.start.Load() {
			return
		}
	}
}

func (rb *RingBuffer[T]) Iterate(fn func(*T) bool) {
	if rb.n.Load() == 0 {
		return
	}

	for i := 0; i < int(rb.n.Load()); i++ {
		if fn(rb.Get(i)) {
			break
		}
	}
}

func (rb *RingBuffer[T]) Advance(di int) {
	c := int64(len(rb.buffer))
	if c == 0 {
		return
	}

	for {
		start := rb.start.Load()
		if rb.start.CompareAndSwap(start, (start+int64(di))%c) {
			return
		}
	}
}

func (rb *RingBuffer[T]) Size() int64 {
	return rb.n.Load()
}

func (rb *RingBuffer[T]) getPushPointer() *T {
	c := int64(len(rb.buffer))
	if c == 0 {
		return nil
	}

	for {
		start := rb.start.Load()
		n := rb.n.Load()

		pushIdx := (start + n) % c
		ptr := &rb.buffer[pushIdx]

		if n == c {
			if !rb.start.CompareAndSwap(start, (start+1)%c) {
				continue
			}
		} else {
			if !rb.n.CompareAndSwap(n, n+1) {
				continue
			}
		}

		return ptr
	}
}

func (rb *RingBuffer[T]) String() string {
	return fmt.Sprintf(
		"RingBuffer at %p { n: %d, start: %d, buf: %v }",
		rb.buffer,
		rb.n.Load(),
		rb.start.Load(),
		rb.buffer,
	)
}
