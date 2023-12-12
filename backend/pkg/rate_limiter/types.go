package rate_limiter

import "time"

type RateLimit struct {
	Limit  int64
	Period time.Duration
}
