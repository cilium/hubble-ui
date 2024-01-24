package throttle

import (
	"time"
)

type Throttle struct {
	ticker      *time.Ticker
	delay       time.Duration
	lastTouchAt time.Time
}

func New(delay time.Duration) *Throttle {
	return &Throttle{
		ticker: nil,
		delay:  delay,
	}
}

func (d *Throttle) Touch() {
	d.ensureTicker()
	d.lastTouchAt = time.Now()
}

func (d *Throttle) Triggered() <-chan time.Time {
	d.ensureTicker()
	return d.ticker.C
}

// NOTE: You cannot have native throttling behaviour with builtin ticker
// but you can check if that trigger event really should be used
func (d *Throttle) IsActivated() bool {
	return time.Since(d.lastTouchAt) <= d.delay
}

func (d *Throttle) Stop() {
	if d.ticker == nil {
		return
	}

	d.ticker.Stop()
}

func (d *Throttle) ensureTicker() {
	if d.ticker == nil {
		d.ticker = time.NewTicker(d.delay)
	}
}
