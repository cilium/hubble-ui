package rate_counter

import (
	"fmt"
	"math"
	"testing"
	"time"
)

type Test struct {
	countingFn   CountingFn
	countNum     int
	delay        time.Duration
	expectedRate float64
	eps          float64
}

type CountingFn func(*RateCounter)

func TestEverything(t *testing.T) {
	runTests(t, []Test{
		{
			countNum:     10,
			delay:        10 * time.Millisecond,
			expectedRate: 100,
			eps:          5,
		},
		{
			countNum:     10,
			delay:        100 * time.Millisecond,
			expectedRate: 10.0,
			eps:          1,
		},
		{
			countNum:     20,
			delay:        50 * time.Millisecond,
			expectedRate: 20.0,
			eps:          1,
		},
		{
			countNum:     10,
			delay:        10 * time.Millisecond,
			expectedRate: 100.0,
			eps:          5,
		},
		{
			countNum:     100,
			delay:        10 * time.Millisecond,
			expectedRate: 100.0,
			eps:          5,
		},
		{
			countNum:     5,
			delay:        20 * time.Millisecond,
			expectedRate: 50,
			eps:          5,
		},
		{
			countingFn: func(rc *RateCounter) {
				for i := 0; i < 5; i++ {
					rc.Count()

					<-time.After(20 * time.Millisecond)
				}

				<-time.After(100 * time.Millisecond)
			},
			expectedRate: 25,
			eps:          1,
		},
	})
}

func runTests(t *testing.T, tests []Test) {
	for _, test := range tests {
		test.Run(t)
	}
}

func (td *Test) Run(t *testing.T) {
	testName := fmt.Sprintf(
		"cnum %d / delay %s",
		td.countNum,
		td.delay,
	)

	if td.countingFn != nil {
		testName = "countingFn"
	}

	t.Run(testName, func(t *testing.T) {
		rc := New()
		if td.countingFn == nil {
			for i := 0; i < td.countNum; i++ {
				rc.Count()

				// if i == td.countNum-1 {
				// 	break
				// }

				<-time.After(td.delay)
			}
		} else {
			td.countingFn(rc)
		}

		r := rc.Rate()
		t.Logf("rate: %.5f\n", r)
		if math.Abs(r-td.expectedRate) > td.eps {
			logInternal(t, rc)

			t.Fatalf(
				"got rate: %.5f, expected: %.5f\n",
				r,
				td.expectedRate,
			)
		}
	})
}

func logInternal(t *testing.T, rc *RateCounter) {
	// t.Logf(
	// 	"quants: %s\n",
	// 	rc.quants,
	// )
}
