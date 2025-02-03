package deque

type Deque[T any] struct {
	start int
	n     int

	data []T
}

func New[T any](size int) *Deque[T] {
	return &Deque[T]{
		start: 0,
		n:     0,
		data:  make([]T, size),
	}
}

func (d *Deque[T]) Get(i int) *T {
	if i >= d.n {
		return nil
	}

	return &d.data[(d.start+i)%len(d.data)]
}

func (d *Deque[T]) Peek() *T {
	if d.n == 0 {
		return nil
	}

	idx := (d.start + d.n - 1) % len(d.data)
	return &d.data[idx]
}

func (d *Deque[T]) PeekBack() *T {
	if d.n == 0 {
		return nil
	}

	return &d.data[d.start]
}

func (d *Deque[T]) Pop() *T {
	if d.n == 0 {
		return nil
	}

	size := len(d.data)
	e := &d.data[(d.start+d.n-1)%size]
	d.n -= 1

	d.checkShrink()
	return e
}

func (d *Deque[T]) Push(e T) {
	d.checkGrow()

	i := (d.start + d.n) % len(d.data)
	d.data[i] = e
	d.n += 1
}

func (d *Deque[T]) PopBack() *T {
	if d.n == 0 {
		return nil
	}

	e := &d.data[d.start]
	d.start = (d.start + 1) % len(d.data)
	d.n -= 1

	d.checkShrink()
	return e
}

func (d *Deque[T]) PushBack(e T) {
	d.checkGrow()
	l := len(d.data)

	i := (d.start + l - 1) % l
	d.start = i
	d.data[i] = e
	d.n += 1
}

func (d *Deque[T]) Size() int {
	return d.n
}

func (d *Deque[T]) Slice() []T {
	s := make([]T, d.Size())

	for i := range d.n {
		s[i] = *d.Get(i)
	}

	return s
}

func (d *Deque[T]) Flush() {
	d.start = 0
	d.n = 0
}

func (d *Deque[T]) checkGrow() {
	if d.n == len(d.data) {
		d.grow()
	}
}

func (d *Deque[T]) checkShrink() {
	if 3*d.n <= len(d.data) {
		d.shrink()
	}
}

func (d *Deque[T]) grow() {
	twice := len(d.data) << 1
	if twice == 0 {
		twice = 1
	}

	d.realloc(twice)
}

func (d *Deque[T]) shrink() {
	newcap := 0
	if d.n > 0 {
		newcap = len(d.data) >> 1
	}

	d.realloc(newcap)
}

func (d *Deque[T]) realloc(newcap int) {
	oldcap := len(d.data)
	newmem := make([]T, newcap)

	for i := range d.n {
		oldi := (d.start + i) % oldcap
		newmem[i] = d.data[oldi]
	}

	d.start = 0
	d.data = newmem
}
