package debounce

import (
	"time"
)

type Debounce struct {
	ticker *time.Timer
	delay  time.Duration
}

func New(delay time.Duration) *Debounce {
	return &Debounce{
		ticker: nil,
		delay:  delay,
	}
}

func (d *Debounce) Touch() {
	if d.ensureTicker() {
		return
	}

	if !d.ticker.Stop() {
		select {
		case <-d.ticker.C:
		default:
		}
	}

	d.ticker.Reset(d.delay)
}

func (d *Debounce) Triggered() <-chan time.Time {
	d.ensureTicker()
	return d.ticker.C
}

func (d *Debounce) Stop() {
	if d.ticker == nil {
		return
	}

	d.ticker.Stop()
}

func (d *Debounce) ensureTicker() bool {
	if d.ticker == nil {
		d.ticker = time.NewTimer(d.delay)
		return true
	}

	return false
}
