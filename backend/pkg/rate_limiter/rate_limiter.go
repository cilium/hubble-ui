package rate_limiter

import (
	"context"
	"sync/atomic"
	"time"
)

const (
	// NOTE: Empty RateLimiter is unlimited one
	UNLIMITED = 0
	DISABLED  = -1
)

// NOTE: GCRA Rate Limiter
// https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm
type RateLimiter struct {
	period         int64
	step           int64
	startTime      time.Time
	lastAcquiredAt atomic.Int64
	bucket         atomic.Int64
}

func New(rl RateLimit) RateLimiter {
	return RateLimiter{
		startTime:      time.Now(),
		period:         rl.Period.Nanoseconds(),
		step:           calculateStep(rl.Limit, rl.Period),
		lastAcquiredAt: atomic.Int64{},
		bucket:         atomic.Int64{},
	}
}

func Unlimited() RateLimiter {
	return New(RateLimit{
		Limit:  UNLIMITED,
		Period: 0,
	})
}

func Disabled() RateLimiter {
	return New(RateLimit{
		Limit:  DISABLED,
		Period: 0,
	})
}

func (rl *RateLimiter) Acquire() (bool, int64) {
	switch rl.step {
	case UNLIMITED:
		return true, 0
	case DISABLED:
		return false, 0
	}

	for {
		now := time.Since(rl.startTime).Nanoseconds()
		lastAcquiredAt := rl.lastAcquiredAt.Load()
		bucket := maxInt64(rl.bucket.Load()-(now-lastAcquiredAt), 0)

		if bucket+rl.step > rl.period {
			minSleep := rl.step - (rl.period - bucket)
			return false, minSleep
		}

		if !rl.lastAcquiredAt.CompareAndSwap(lastAcquiredAt, now) {
			continue
		}

		rl.bucket.Store(bucket + rl.step)
		return true, 0
	}
}

func (rl *RateLimiter) Wait(ctx context.Context) error {
	acquired, _dur := rl.Acquire()
	if acquired {
		return nil
	}

	dur := time.Nanosecond * time.Duration(_dur)
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(dur):
		return nil
	}
}

func calculateStep(limit int64, period time.Duration) int64 {
	switch limit {
	case UNLIMITED:
		return UNLIMITED
	case DISABLED:
		return DISABLED
	}

	return period.Nanoseconds() / limit
}

func maxInt64(a, b int64) int64 {
	if a > b {
		return a
	}

	return b
}
