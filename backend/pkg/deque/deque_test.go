package deque

import "testing"

func TestDeque(t *testing.T) {
	fullTest(t, 0)
	fullTest(t, 1)
	fullTest(t, 2)
	fullTest(t, 4)
	fullTest(t, 8)
	fullTest(t, 31)
	fullTest(t, 1057)
}

func printDebug[T any](t *testing.T, d *Deque[T]) {
	t.Logf(
		"deque start: %d, n: %d, data.len: %d, data.cap: %d, data: %v\n",
		d.start,
		d.n,
		len(d.data),
		cap(d.data),
		d.data,
	)
}

func fullTest(t *testing.T, initcap int) {
	d := New[int](uint(initcap))

	if s := d.Size(); s != 0 {
		t.Fatalf("initial deque has invalid size: %d\n", s)
	}

	zeroCheck(t, d, initcap, false)
	pushElements(t, d, initcap)
	popElements(t, d, initcap)

	zeroCheck(t, d, initcap, true)
	pushBackElements(t, d, initcap)
	popBackElements(t, d, initcap)

	zeroCheck(t, d, initcap, true)
	pushElements(t, d, initcap)
	popAndPopBackElements(t, d, initcap)

	zeroCheck(t, d, initcap, true)
	pushBackElements(t, d, initcap)
	popAndPopBackElements(t, d, initcap)

	pushFrontAndBackElements(t, d, initcap)
	popAndPopBackElements(t, d, initcap)
	zeroCheck(t, d, initcap, true)
}

func pushFrontAndBackElements(t *testing.T, d *Deque[int], initcap int) {
	n := initcap >> 1
	m := initcap - n

	for i := 0; i < n; i++ {
		d.Push(initcap - (n - i) + 1)
	}

	for i := 0; i < m; i++ {
		d.PushBack(m - i)
	}

	printDebug(t, d)
	for i := 0; i < initcap; i++ {
		e := d.Get(uint(i))

		if e == nil {
			t.Fatalf(
				"pushFrontAndBackElements %d: %d element is nil\n",
				initcap,
				i,
			)
			return
		}

		if *e != i+1 {
			t.Fatalf(
				"pushFrontAndBackElements %d: %d element is %d (%d is expected)\n",
				initcap,
				i,
				*e,
				i+1,
			)
		}
	}
}

func popAndPopBackElements(t *testing.T, d *Deque[int], initcap int) {
	n := initcap >> 1
	m := initcap - n

	for i := 0; i < n; i++ {
		e := d.Pop()
		if *e != initcap-i {
			t.Fatalf(
				"popAndPopBackElements %d: Pop() gives wrong element: %d\n",
				initcap,
				*e,
			)
		}
	}

	for i := 0; i < m; i++ {
		e := d.PopBack()
		if *e != i+1 {
			t.Fatalf(
				"popAndPopBackElements %d, PopBack() gives wrong element: %d\n",
				initcap,
				*e,
			)
		}
	}
}

func zeroCheck(t *testing.T, d *Deque[int], initcap int, capcheck bool) {
	if d.Size() != 0 {
		t.Fatalf(
			"zeroCheck: deque has size %d (initcap: %d)\n",
			d.Size(),
			initcap,
		)
	}

	if len(d.data) != 0 && capcheck {
		t.Fatalf(
			"zeroCheck: deque data has len() = %d after flushing (initcap: %d)\n",
			len(d.data),
			initcap,
		)
	}

	for i := 0; i < 42; i++ {
		e := d.Pop()
		if e != nil {
			t.Fatalf("zeroCheck %d: Pop() gives non-zero element\n", initcap)
		}
	}

	for i := 0; i < 42; i++ {
		e := d.PopBack()
		if e != nil {
			t.Fatalf("zeroCheck %d: PopBack() gives non-zero element\n", initcap)
		}
	}
}

func popBackElements(t *testing.T, d *Deque[int], amount int) {
	if d.Size() != uint(amount) {
		t.Fatalf(
			"popBackElements: d.Size() (%d) != amount (%d)\n",
			d.Size(),
			amount,
		)
	}

	for i := 0; i < amount; i++ {
		e := d.PopBack()
		if e == nil {
			t.Fatalf(
				"popBackElements(%d): %d element is nil (%d is expected)\n",
				amount,
				i,
				amount-i,
			)
			return
		}

		if *e != i+1 {
			t.Fatalf(
				"popBackElements(%d): %d element is %d (%d is expected)\n",
				amount,
				i,
				*e,
				amount-i,
			)
		}
	}

}

func pushBackElements(t *testing.T, d *Deque[int], amount int) {
	for i := 0; i < amount; i++ {
		d.PushBack(amount - i)
	}

	for i := 0; i < amount; i++ {
		e := d.Get(uint(i))
		if e == nil {
			t.Fatalf(
				"pushBackElements(%d): %d element is nil (%d is expected)\n",
				amount,
				i,
				i+1,
			)
			return
		}

		if *e != i+1 {
			t.Fatalf(
				"pushBackElements(%d): %d element is %d (%d is expected)\n",
				amount,
				i,
				*e,
				i+1,
			)
		}
	}

	if d.Size() != uint(amount) {
		t.Fatalf(
			"pushBackElements: d.Size() (%d) != amount (%d)\n",
			d.Size(),
			amount,
		)
	}
}

func pushElements(t *testing.T, d *Deque[int], amount int) {
	for i := 0; i < amount; i++ {
		d.Push(i + 1)
	}

	for i := 0; i < amount; i++ {
		e := d.Get(uint(i))
		if e == nil {
			t.Fatalf(
				"pushElements(%d): %d element is nil (%d is expected)\n",
				amount,
				i,
				i+1,
			)
			return
		}

		if *e != i+1 {
			t.Fatalf(
				"pushElements(%d): %d element is %d (%d is expected)\n",
				amount,
				i,
				*e,
				i+1,
			)
		}
	}

	if d.Size() != uint(amount) {
		t.Fatalf("pushElements: d.Size() (%d) != amount (%d)\n", d.Size(), amount)
	}
}

func popElements(t *testing.T, d *Deque[int], amount int) {
	if d.Size() != uint(amount) {
		t.Fatalf("popElements: d.Size() (%d) != amount (%d)\n", d.Size(), amount)
	}

	for i := 0; i < amount; i++ {
		e := d.Pop()
		if e == nil {
			t.Fatalf(
				"popElements(%d): %d element is nil (%d is expected)\n",
				amount,
				i,
				amount-i,
			)
			return
		}

		if *e != amount-i {
			t.Fatalf(
				"popElements(%d): %d element is %d (%d is expected)\n",
				amount,
				i,
				*e,
				amount-i,
			)
		}
	}
}
