package dllist

import (
	"fmt"
	"strings"
	"sync"
)

type DLList[T any] struct {
	lock *sync.RWMutex

	root *ListItem[T]
	n    uint
}

func NewDLList[T any]() *DLList[T] {
	root := new(ListItem[T])
	root.prev = root
	root.next = root

	return &DLList[T]{
		lock: new(sync.RWMutex),
		root: root,
		n:    0,
	}
}

func (list *DLList[T]) Clear() {
	list.lock.Lock()
	defer list.lock.Unlock()

	list.n = 0

	root := new(ListItem[T])
	root.prev = root
	root.next = root

	list.root = root
}

func (list *DLList[T]) Add(d T) *ListItem[T] {
	list.lock.Lock()
	defer list.lock.Unlock()

	added := newListItem(list, d)
	head := list.root.prev

	added.prev = head
	head.next = added

	added.next = list.root
	list.root.prev = added

	list.n += 1
	return added
}

func (list *DLList[T]) Size() uint {
	return list.n
}

func (list *DLList[T]) Iterate(fn func(*ListItem[T])) {
	list.lock.Lock()

	if list.root.next == list.root {
		list.lock.Unlock()
		return
	}

	cur := list.root.next
	for i := uint(0); i < list.n && cur != nil; i++ {
		list.lock.Unlock()
		fn(cur)
		list.lock.Lock()

		cur = cur.next
	}

	list.lock.Unlock()
}

func (list *DLList[T]) String() string {
	dataStr := strings.Builder{}
	r := list.root
	fmt.Fprintf(&dataStr, "[")

	if r != r.next {
		cur := r.next
		for i := uint(0); i < list.n; i++ {
			fmt.Fprintf(&dataStr, "%v", cur.Datum)
			if i != list.n-1 {
				fmt.Fprintf(&dataStr, ", ")
			}

			cur = cur.next
		}
	}

	fmt.Fprintf(&dataStr, "]")

	return fmt.Sprintf(
		"<EventChannels[%d] at %p: %s>",
		list.n,
		list,
		dataStr.String(),
	)
}
