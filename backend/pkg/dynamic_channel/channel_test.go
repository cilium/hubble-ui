package dchannel

import (
	"context"
	"errors"
	"runtime"
	"sync"
	"testing"
	"time"
)

var (
	ncpu = runtime.NumCPU()
)

func TestBlockedPushBlockedPop(t *testing.T) {
	producerFn := func(gctx *GoroutineContext[int, *intAccumulator]) {
		gctx.td.IterateProduce(func(i int) {
			if err := gctx.dch.Enqueue(gctx.ctx, gctx.acc.Produce()); err != nil {
				t.Fatalf(err.Error())
			}
		})
	}

	consumerFn := func(gctx *GoroutineContext[int, *intAccumulator]) {
		for {
			elem, err := gctx.dch.Dequeue(gctx.ctx)
			if errors.Is(err, context.DeadlineExceeded) {
				break
			}

			if err != nil {
				t.Fatalf("Dequeue failed with error: %v\n", err)
				break
			}

			gctx.acc.Consume(*elem)
		}
	}

	runTest(t, "1 Producer / 1 Consumer", TestDescriptor[int, *intAccumulator]{
		nproducers: 1,
		nproduces:  10000,
		nconsumers: 1,
		accumFn:    newIntAccumulator,
		producerFn: func(gctx *GoroutineContext[int, *intAccumulator]) {
			gctx.td.IterateProduce(func(i int) {
				num := gctx.acc.Produce()

				if err := gctx.dch.Enqueue(gctx.ctx, num); err != nil {
					t.Fatalf(err.Error())
				}
			})
		},
		consumerFn: consumerFn,
		checkFn: func(
			t *testing.T,
			td *TestDescriptor[int, *intAccumulator],
			gctxs []*GoroutineContext[int, *intAccumulator],
		) {
			pctx, cctx := gctxs[0], gctxs[1]
			sanityTest(t, pctx)
			sanityTest(t, cctx)

			if pctx.acc.TotalProduced() != cctx.acc.TotalConsumed() {
				t.Fatalf("produced != consumed\n")
			}

			for _, producedInt := range pctx.acc.produced {
				if cctx.acc.TimesConsumed(producedInt) != 1 {
					t.Fatalf(
						"integer wasnt consumed: %d\n",
						producedInt,
					)
				}
			}
		},
	})

	runTest(t, "N Producers / 1 Consumer", TestDescriptor[int, *intAccumulator]{
		nproducers: ncpu,
		nproduces:  1000,
		nconsumers: 1,
		accumFn:    newIntAccumulator,
		producerFn: producerFn,
		consumerFn: consumerFn,
		checkFn: func(
			t *testing.T,
			td *TestDescriptor[int, *intAccumulator],
			gctxs []*GoroutineContext[int, *intAccumulator],
		) {
			for _, gctx := range gctxs {
				sanityTest(t, gctx)

				if gctx.isProducer {
					continue
				}

				testEveryConsumedElemTimes(t, gctx, gctx.td.nproducers)
			}
		},
	})

	runTest(t, "1 Producer / N Consumers", TestDescriptor[int, *intAccumulator]{
		nproducers: 1,
		nproduces:  ncpu * 1000,
		nconsumers: ncpu,
		accumFn:    newIntAccumulator,
		producerFn: producerFn,
		consumerFn: consumerFn,
		checkFn: func(
			t *testing.T,
			td *TestDescriptor[int, *intAccumulator],
			gctxs []*GoroutineContext[int, *intAccumulator],
		) {
			testProducedConsumedParity(t, td, gctxs)
		},
	})

	runTest(t, "N Producers / M Consumers", TestDescriptor[int, *intAccumulator]{
		nproducers: ncpu,
		nproduces:  1000,
		nconsumers: ncpu,
		accumFn:    newIntAccumulator,
		producerFn: producerFn,
		consumerFn: consumerFn,
		checkFn: func(
			t *testing.T,
			td *TestDescriptor[int, *intAccumulator],
			gctxs []*GoroutineContext[int, *intAccumulator],
		) {
			testProducedConsumedParity(t, td, gctxs)
		},
	})
}

func TestNonblockedPushBlockedPop(t *testing.T) {
	producerFn := func(gctx *GoroutineContext[int, *intAccumulator]) {
		gctx.td.IterateProduce(func(i int) {
			gctx.dch.EnqueueNonblock(gctx.acc.Produce())
		})
	}

	consumerFn := func(gctx *GoroutineContext[int, *intAccumulator]) {
		for {
			elem, err := gctx.dch.Dequeue(gctx.ctx)
			if errors.Is(err, context.DeadlineExceeded) {
				break
			}

			if err != nil {
				gctx.t.Fatalf("Dequeue failed with error: %v\n", err)
				break
			}

			gctx.acc.Consume(*elem)
		}
	}

	runTest(t, "1 Producer / 1 Consumer", TestDescriptor[int, *intAccumulator]{
		nproducers: 1,
		nproduces:  10000,
		nconsumers: 1,
		accumFn:    newIntAccumulator,
		producerFn: producerFn,
		consumerFn: consumerFn,
		checkFn: func(
			t *testing.T,
			td *TestDescriptor[int, *intAccumulator],
			gctxs []*GoroutineContext[int, *intAccumulator],
		) {
			pctx, cctx := gctxs[0], gctxs[1]
			sanityTest(t, pctx)
			sanityTest(t, cctx)

			if pctx.acc.TotalProduced() != cctx.acc.TotalConsumed() {
				t.Fatalf("produced != consumed\n")
			}

			for _, producedInt := range pctx.acc.produced {
				if cctx.acc.TimesConsumed(producedInt) != 1 {
					t.Fatalf(
						"integer wasnt consumed: %d\n",
						producedInt,
					)
				}
			}
		},
	})

	runTest(t, "N Producers / 1 Consumer", TestDescriptor[int, *intAccumulator]{
		nproducers: ncpu,
		nproduces:  1000,
		nconsumers: 1,
		accumFn:    newIntAccumulator,
		producerFn: producerFn,
		consumerFn: consumerFn,
		checkFn: func(
			t *testing.T,
			td *TestDescriptor[int, *intAccumulator],
			gctxs []*GoroutineContext[int, *intAccumulator],
		) {
			for _, gctx := range gctxs {
				sanityTest(t, gctx)

				if gctx.isProducer {
					continue
				}

				testEveryConsumedElemTimes(t, gctx, gctx.td.nproducers)
			}
		},
	})

	runTest(t, "1 Producer / N Consumers", TestDescriptor[int, *intAccumulator]{
		nproducers: 1,
		nproduces:  ncpu * 1000,
		nconsumers: ncpu,
		accumFn:    newIntAccumulator,
		producerFn: producerFn,
		consumerFn: consumerFn,
		checkFn: func(
			t *testing.T,
			td *TestDescriptor[int, *intAccumulator],
			gctxs []*GoroutineContext[int, *intAccumulator],
		) {
			testProducedConsumedParity(t, td, gctxs)
		},
	})

	runTest(t, "N Producers / M Consumers", TestDescriptor[int, *intAccumulator]{
		nproducers: ncpu,
		nproduces:  1000,
		nconsumers: ncpu,
		accumFn:    newIntAccumulator,
		producerFn: producerFn,
		consumerFn: consumerFn,
		checkFn: func(
			t *testing.T,
			td *TestDescriptor[int, *intAccumulator],
			gctxs []*GoroutineContext[int, *intAccumulator],
		) {
			testProducedConsumedParity(t, td, gctxs)
		},
	})
}

func runTest[T, A any](t *testing.T, testName string, td TestDescriptor[T, A]) {
	dch := New[T]()

	waitn := td.nproducers + td.nconsumers
	barrier := make(chan struct{}, waitn)

	commonAcc := td.accumFn()
	gctxs := []*GoroutineContext[T, A]{}
	pctx := context.Background()
	cctx, cancel := context.WithTimeout(pctx, 100*time.Millisecond)
	defer cancel()

	t.Run(testName, func(t *testing.T) {
		nsuccess := 0
		if td.producerFn != nil {
			for i := 0; i < td.nproducers; i++ {
				gctx := &GoroutineContext[T, A]{
					t:          t,
					ctx:        pctx,
					isProducer: true,
					num:        i,
					acc:        td.accumFn(),
					commonAcc:  commonAcc,
					td:         &td,
					finished:   barrier,
					dch:        dch,
				}

				gctxs = append(gctxs, gctx)

				go func() {
					td.producerFn(gctx)
					barrier <- struct{}{}
				}()
			}
		}

		if td.consumerFn != nil {
			for i := 0; i < td.nconsumers; i++ {
				gctx := &GoroutineContext[T, A]{
					t:          t,
					ctx:        cctx,
					isProducer: false,
					num:        i,
					acc:        td.accumFn(),
					commonAcc:  commonAcc,
					td:         &td,
					finished:   barrier,
					dch:        dch,
				}

				gctxs = append(gctxs, gctx)
				go func() {
					td.consumerFn(gctx)
					barrier <- struct{}{}
				}()
			}
		}

	F:
		for {
			select {
			case <-time.After(60 * time.Second):
				t.Fatalf("test timeout")
			case <-barrier:
				nsuccess++

				if nsuccess == waitn {
					break F
				}
			}
		}

		if td.checkFn != nil {
			td.checkFn(t, &td, gctxs)
		}
	})
}

type TestDescriptor[T, A any] struct {
	nproducers int
	nproduces  int
	nconsumers int
	accumFn    func() A
	producerFn func(*GoroutineContext[T, A])
	consumerFn func(*GoroutineContext[T, A])
	checkFn    func(*testing.T, *TestDescriptor[T, A], []*GoroutineContext[T, A])
}

func (td *TestDescriptor[T, A]) IterateProduce(fn func(int)) {
	for i := 0; i < td.nproduces; i++ {
		fn(i)
	}
}

type GoroutineContext[T, A any] struct {
	ctx        context.Context
	isProducer bool
	num        int
	finished   chan struct{}
	commonAcc  A
	acc        A
	td         *TestDescriptor[T, A]
	t          *testing.T
	dch        *DynamicChannel[T]
}

func sanityTest(t *testing.T, gctx *GoroutineContext[int, *intAccumulator]) {
	if gctx.isProducer {
		np := gctx.acc.TotalProduced()
		if np != gctx.td.nproduces {
			t.Fatalf(
				"producer %d produced wrong amount of elems: %d (%d expected)\n",
				gctx.num,
				np,
				gctx.td.nproduces,
			)
		}

		for elem, ntimes := range gctx.acc.producedSet {
			if ntimes != 1 {
				t.Fatalf(
					"producer %d produced elem %d %d times\n",
					gctx.num,
					elem,
					ntimes,
				)
			}
		}
	}
}

func testEveryConsumedElemTimes(
	t *testing.T,
	gctx *GoroutineContext[int, *intAccumulator],
	ntimes int,
) {
	for _, elem := range gctx.acc.consumed {
		if nc := gctx.acc.TimesConsumed(elem); nc != ntimes {
			t.Fatalf(
				"elem %d was consumed %d times (%d expected)\n",
				elem,
				nc,
				ntimes,
			)
		}
	}
}

func testProducedConsumedParity(
	t *testing.T,
	td *TestDescriptor[int, *intAccumulator],
	gctxs []*GoroutineContext[int, *intAccumulator],
) {
	nproduced := 0
	nconsumed := 0

	for _, gctx := range gctxs {
		sanityTest(t, gctx)

		if gctx.isProducer {
			nproduced += gctx.acc.TotalProduced()
		} else {
			nconsumed += gctx.acc.TotalConsumed()
		}
	}

	if nproduced != td.nproducers*td.nproduces {
		t.Fatalf(
			"nproduced = %d (%d expected)\n",
			nproduced,
			td.nproducers*td.nproduces,
		)
	}

	if nproduced != nconsumed {
		t.Fatalf(
			"nproduced (%d) != nconsumed (%d)",
			nproduced,
			nconsumed,
		)
	}

}

type intAccumulator struct {
	mx          sync.Mutex
	produced    []int
	producedSet map[int]int
	consumed    []int
	consumedSet map[int]int
}

func newIntAccumulator() *intAccumulator {
	return &intAccumulator{
		mx:          sync.Mutex{},
		produced:    []int{},
		producedSet: make(map[int]int),
		consumed:    []int{},
		consumedSet: make(map[int]int),
	}
}

func (ia *intAccumulator) TotalProduced() int {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	return len(ia.produced)
}

func (ia *intAccumulator) TotalConsumed() int {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	return len(ia.consumed)
}

func (ia *intAccumulator) Consume(i int) {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	ia.saveConsumed(i)
}

func (ia *intAccumulator) IsConsumed(i int) bool {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	_, exists := ia.consumedSet[i]
	return exists
}

func (ia *intAccumulator) Produce() int {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	num := 1
	if n := len(ia.produced); n > 0 {
		num = ia.produced[n-1] + 1
	}

	ia.saveProducedUnsafe(num)
	return num
}

func (ia *intAccumulator) ConsumedDups() map[int]int {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	dups := make(map[int]int)

	for k, v := range ia.consumedSet {
		if v > 1 {
			dups[k] = v
		}
	}

	return dups
}

func (ia *intAccumulator) SaveProduced(num int) {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	ia.saveProducedUnsafe(num)
}

func (ia *intAccumulator) saveProducedUnsafe(num int) {
	ia.produced = append(ia.produced, num)
	if ntimes, exists := ia.producedSet[num]; exists {
		ia.producedSet[num] = ntimes + 1
	} else {
		ia.producedSet[num] = 1
	}
}

func (ia *intAccumulator) saveConsumed(num int) {
	ia.consumed = append(ia.consumed, num)
	if ntimes, exists := ia.consumedSet[num]; exists {
		ia.consumedSet[num] = ntimes + 1
	} else {
		ia.consumedSet[num] = 1
	}
}

func (ia *intAccumulator) TimesConsumed(num int) int {
	times := ia.consumedSet[num]
	return times
}

func (ia *intAccumulator) TimesProduced(num int) int {
	times := ia.producedSet[num]
	return times
}

func (ia *intAccumulator) HasProduced(num int) bool {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	_, exists := ia.producedSet[num]
	return exists
}

func (ia *intAccumulator) IsLastProduced(num int) bool {
	lnum, exists := ia.LastProduced()
	return exists && lnum == num
}

func (ia *intAccumulator) LastProduced() (int, bool) {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	if n := len(ia.produced); n == 0 {
		return 0, false
	} else {
		return ia.produced[n-1], true
	}
}

func (ia *intAccumulator) IterateWindowProduced(wsize int, fn func(window []int)) {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	n := len(ia.produced)
	if n < wsize {
		fn(ia.produced)
		return
	}

	for i := 0; i+wsize <= n; i++ {
		j := i + wsize
		if j > n {
			j = n
		}

		fn(ia.produced[i:j])
	}
}

func (ia *intAccumulator) IterateWindowConsumed(wsize int, fn func(window []int)) {
	ia.mx.Lock()
	defer ia.mx.Unlock()

	n := len(ia.consumed)
	if n < wsize {
		fn(ia.consumed)
		return
	}

	for i := 0; i+wsize <= n; i++ {
		j := i + wsize
		if j > n {
			j = n
		}

		fn(ia.consumed[i:j])
	}
}
