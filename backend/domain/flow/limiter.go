package flow

import (
	"time"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
)

type Limiter struct {
	Flushed      chan []*pbFlow.Flow
	buffer       []*pbFlow.Flow
	flushTimeout time.Duration
}

func NewLimiter(flushTimeout time.Duration) *Limiter {
	limiter := &Limiter{
		Flushed:      make(chan []*pbFlow.Flow),
		buffer:       []*pbFlow.Flow{},
		flushTimeout: flushTimeout,
	}

	limiter.run()

	return limiter
}

func (fl *Limiter) Push(f *pbFlow.Flow) {
	fl.buffer = append(fl.buffer, f)
}

func (fl *Limiter) run() {
	go func() {
		ticker := time.NewTicker(fl.flushTimeout)
		defer ticker.Stop()
		lastFlush := time.Now()
		for range ticker.C {
			if time.Since(lastFlush) < fl.flushTimeout {
				continue
			}

			fl.flush()
			lastFlush = time.Now()
		}
	}()
}

func (fl *Limiter) flush() {
	fl.Flushed <- fl.buffer
	fl.buffer = []*pbFlow.Flow{}
}
