package ring_buffer

import (
	"fmt"
	"testing"
)

type TestDescriptor[T comparable] struct {
	name           string
	size           int
	push           []T
	popTimes       int
	expectPopped   []T
	expectSize     int
	expectElems    []T
	customBehavior func(*RingBuffer[T])
}

func TestEverything(t *testing.T) {
	runTests(t, []TestDescriptor[int]{
		{
			size:        1,
			push:        []int{1, 2, 3},
			expectElems: []int{3},
		},
		{
			size:       1,
			push:       []int{1, 2, 3, 4, 5},
			popTimes:   10,
			expectSize: 0,
		},
		{
			size:       0,
			push:       []int{1, 2, 3},
			expectSize: 0,
		},
		{
			size:         3,
			push:         []int{1, 2, 3},
			expectPopped: []int{3, 2, 1},
			expectSize:   0,
		},
		{
			size:         5,
			push:         []int{1, 2, 3, 4, 5, 6},
			expectPopped: []int{6, 5, 4, 3, 2},
		},
		{
			size:       5,
			push:       []int{1, 2, 3, 4, 5, 6},
			popTimes:   1,
			expectSize: 4,
		},
		{
			size: 5,
			customBehavior: func(rb *RingBuffer[int]) {
				for i := 0; i < 5; i++ {
					rb.Push(i + 1)
				}

				for i := 0; i < 13; i++ {
					rb.Pop()
				}

				for i := 0; i < 5; i++ {
					rb.Push(i + 1)
				}
			},
			expectElems: []int{1, 2, 3, 4, 5},
		},
		{
			size: 5,
			customBehavior: func(rb *RingBuffer[int]) {
				for i := 0; i < 5; i++ {
					rb.Push(i + 1)
				}

				for i := 0; i < 13; i++ {
					rb.Pop()
				}

				for i := 0; i < 3; i++ {
					rb.Push(i + 1)
				}
			},
			expectElems: []int{1, 2, 3},
		},
	})
}

func runTests[T comparable](t *testing.T, tests []TestDescriptor[T]) {
	for i, td := range tests {
		name := td.name
		if len(name) == 0 {
			name = fmt.Sprintf("test %d", i)
		}

		copied := td
		t.Run(name, func(t *testing.T) {
			t.Parallel()

			copied.Run(t)
		})
	}
}

func (td *TestDescriptor[T]) Run(t *testing.T) {
	rb := New[T](uint(td.size))

	if td.customBehavior != nil {
		td.customBehavior(rb)
	}

	if len(td.push) > 0 {
		for _, elem := range td.push {
			rb.Push(elem)
		}
	}

	popped := make([]T, 0)
	if td.popTimes > 0 || len(td.expectPopped) > 0 {
		popTimes := td.popTimes
		if popTimes == 0 {
			popTimes = len(td.expectPopped)
		}

		for i := 0; i < popTimes; i++ {
			if elem := rb.Pop(); elem != nil {
				popped = append(popped, *elem)
			}
		}
	}

	if td.expectPopped != nil {
		if len(td.expectPopped) == 0 && len(popped) > 0 {
			t.Fatalf("popped expected to be empty, but its not: %v\n", popped)
		}

		if len(td.expectPopped) != len(popped) {
			t.Fatalf(
				"popped elems are different: %v (expected: %v)\n",
				popped,
				td.expectPopped,
			)
		}

		for i, elem := range td.expectPopped {
			poppedElem := popped[i]

			if elem != poppedElem {
				t.Logf("expectPopped: %v, elems: %v\n", td.expectPopped, rb.buffer)
				t.Fatalf(
					"%d popped elem is different: %v (expected: %v)\n",
					i,
					poppedElem,
					elem,
				)
			}
		}
	}

	if td.expectElems != nil {
		if int64(len(td.expectElems)) != rb.Size() {
			t.Fatalf(
				"expected elems are %v, but in fact we got: %v\n",
				td.expectElems,
				rb.buffer,
			)
		}

		for i, elem := range td.expectElems {
			inside := rb.Get(i)
			if inside == nil {
				t.Fatalf(
					"at %d expected elem %v, but nil received\n",
					i,
					elem,
				)
				return
			}

			if *inside != elem {
				t.Fatalf(
					"at %d expected elem %v, but got %v\n",
					i,
					elem,
					*inside,
				)
			}
		}
	}

	if td.expectElems == nil && int64(td.expectSize) != rb.Size() {
		printRB(t, rb)
		t.Fatalf("wrong size: %d (expected: %d)\n", rb.Size(), td.expectSize)
	}
}

func printRB[T any](t *testing.T, rb *RingBuffer[T]) {
	t.Logf(
		"ring buffer: %v (n: %d, start: %d, size: %d)\n",
		rb.buffer,
		rb.n.Load(),
		rb.start.Load(),
		rb.Size(),
	)
}
