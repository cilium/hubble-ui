package flow

import (
	"time"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
)

type FlowLimiter struct {
	Flushed      chan []*pbFlow.Flow
	buffer       []*pbFlow.Flow
	flushTimeout time.Duration
}

func NewLimiter(flushTimeout time.Duration) *FlowLimiter {
	limiter := &FlowLimiter{
		Flushed:      make(chan []*pbFlow.Flow),
		buffer:       []*pbFlow.Flow{},
		flushTimeout: flushTimeout,
	}

	limiter.run()

	return limiter
}

func (fl *FlowLimiter) Push(f *pbFlow.Flow) {
	fl.buffer = append(fl.buffer, f)
}

func (fl *FlowLimiter) run() {
	ticker := time.Tick(fl.flushTimeout)

	go func() {
		lastFlush := time.Now()
		for range ticker {
			if time.Since(lastFlush) < fl.flushTimeout {
				continue
			}

			fl.flush()
			lastFlush = time.Now()
		}
	}()
}

func (fl *FlowLimiter) flush() {
	fl.Flushed <- fl.buffer
	fl.buffer = []*pbFlow.Flow{}
}
