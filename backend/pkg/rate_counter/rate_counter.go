package rate_counter

import (
	"time"

	"github.com/cilium/hubble-ui/backend/pkg/ring_buffer"
)

type RateCounter struct {
	quants *ring_buffer.RingBuffer[int64]
}

func New() *RateCounter {
	return &RateCounter{
		quants: ring_buffer.New[int64](100),
	}
}

func (rc *RateCounter) Count() {
	rc.quants.Push(time.Now().UnixNano())
}

func (rc *RateCounter) Rate() float64 {
	now := time.Now().UnixNano()
	counter := float64(rc.quants.Size())

	if counter < 2 {
		return 0.0
	}

	first := rc.quants.GetFirst()
	timeNanos := float64(now - *first)

	return counter / timeNanos * 1e9
}

func (rc *RateCounter) LastCount() *time.Time {
	last := rc.quants.GetLast()
	if last == nil {
		return nil
	}

	t := time.Unix(0, *last)
	return &t
}
