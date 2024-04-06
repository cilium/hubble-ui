package dllist

// NOTE: ListItem are not safe to be shared across threads
type ListItem[T any] struct {
	list *DLList[T]
	prev *ListItem[T]
	next *ListItem[T]

	Datum T
}

func newListItem[T any](l *DLList[T], d T) *ListItem[T] {
	ch := new(ListItem[T])
	ch.list = l
	ch.Datum = d

	return ch
}

func (c *ListItem[T]) Drop() {
	c.list.lock.Lock()
	defer c.list.lock.Unlock()

	c.prev.next = c.next
	c.next.prev = c.prev
	c.list.n -= 1
}
