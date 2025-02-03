package rate_limiter

import (
	"testing"
	"time"
)

func TestDisabled(t *testing.T) {
	rl := Disabled()

	for range 10_000 {
		if acq, _ := rl.Acquire(); acq {
			t.Fatal("disabled rate limiter acquired")
		}
	}
}

func TestUnlimited(t *testing.T) {
	rl := Unlimited()

	for range 10_000 {
		if acq, _ := rl.Acquire(); !acq {
			t.Fatal("unlimited rate limiter doesnt acquire")
		}
	}
}

func TestLimited(t *testing.T) {
	delays := []time.Duration{10_000_000}
	parts := 10

	for _, delay := range delays {
		period := time.Duration(parts) * delay
		tname := "period-" + period.String()

		_delay := delay
		t.Run(tname, func(t *testing.T) {
			rl := New(RateLimit{
				Limit:  1,
				Period: period,
			})

			if acq, _ := rl.Acquire(); !acq {
				t.Fatal("first acquire failed")
			}

			for i := range parts - 1 {
				t.Logf("before sleep %d (%s)\n", i, delay)
				sleep(_delay)

				if acq, _ := rl.Acquire(); acq {
					t.Fatalf("%d acquire didnt fail\n", i)
				}
			}

			sleep(_delay)
			if acq, _ := rl.Acquire(); !acq {
				t.Fatalf("acquire after for loop didnt work\n")
			}
		})
	}
}

// NOTE: Sorry, but time.Sleep and time.After are too inaccurate
// TODO: Introduce generic param for RateLimiter for Clock implementation
func sleep(d time.Duration) {
	start := time.Now().UnixNano()
	dn := d.Nanoseconds()

	for {
		elapsed := time.Now().UnixNano() - start
		if elapsed < dn {
			continue
		}

		return
	}
}
