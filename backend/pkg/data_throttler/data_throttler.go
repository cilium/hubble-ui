package data_throttler

import (
	"errors"
	"sync"
	"time"

	"github.com/cilium/hubble-ui/backend/pkg/deque"
)

var (
	ErrUnbounded = errors.New("unbounded throttler is not allowed")
)

type DataThrottler[T any] struct {
	mx          sync.Mutex
	buffer      *deque.Deque[T]
	maxLength   uint
	delay       time.Duration
	lastFlashAt time.Time
	ticker      *time.Ticker
	tickerCh    chan struct{}
	stop        chan struct{}
	stopOnce    sync.Once
}

func New[T any](delay time.Duration, maxLength uint) (*DataThrottler[T], error) {
	if maxLength == 0 {
		return nil, ErrUnbounded
	}

	return &DataThrottler[T]{
		mx:        sync.Mutex{},
		buffer:    deque.New[T](maxLength),
		maxLength: maxLength,
		delay:     delay,
		stopOnce:  sync.Once{},
	}, nil
}

func (d *DataThrottler[T]) Push(datum T) bool {
	d.mx.Lock()
	defer d.mx.Unlock()

	if d.buffer.Size() == d.maxLength {
		return false
	}

	d.buffer.Push(datum)
	return true
}

func (d *DataThrottler[T]) IterateAndFlush(fn func(*T)) {
	d.mx.Lock()
	defer d.mx.Unlock()

	for i := uint(0); i < d.buffer.Size(); i++ {
		fn(d.buffer.Get(i))
	}

	// NOTE: This prevents deque from doing any reallocations
	d.buffer.Flush()
	d.lastFlashAt = time.Now()
}

func (d *DataThrottler[T]) Ticker() <-chan struct{} {
	d.mx.Lock()
	defer d.mx.Unlock()

	if d.tickerCh != nil {
		return d.tickerCh
	}

	d.ticker = time.NewTicker(d.delay)
	d.tickerCh = make(chan struct{})

	go func() {
		for {
			select {
			case <-d.ticker.C:
				d.mx.Lock()

				if d.buffer.Size() == 0 {
					d.mx.Unlock()
					continue
				}

				if !d.lastFlashAt.IsZero() && time.Since(d.lastFlashAt) < d.delay {
					d.mx.Unlock()
					continue
				}

				d.mx.Unlock()
				d.tickerCh <- struct{}{}
			case <-d.stop:
				return
			}
		}
	}()

	return d.tickerCh
}

func (d *DataThrottler[T]) Size() uint {
	d.mx.Lock()
	defer d.mx.Unlock()

	return d.buffer.Size()
}

func (d *DataThrottler[T]) Flush() []T {
	d.mx.Lock()
	defer d.mx.Unlock()

	d.lastFlashAt = time.Now()
	s := d.buffer.Slice()
	d.buffer.Flush()

	return s
}

func (d *DataThrottler[T]) Stop() {
	d.mx.Lock()
	defer d.mx.Unlock()

	d.stopOnce.Do(func() {
		d.ticker.Stop()
		close(d.stop)
	})
}
