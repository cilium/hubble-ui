package channel

import (
	"sync"
	"time"
)

type Channels struct {
	mx sync.Mutex
	d  map[string]*Channel
}

func NewChannels() *Channels {
	return &Channels{
		mx: sync.Mutex{},
		d:  make(map[string]*Channel),
	}
}

func (c *Channels) Lock() {
	c.mx.Lock()
}

func (c *Channels) Unlock() {
	c.mx.Unlock()
}

func (c *Channels) SetByIdUnsafe(ch *Channel) {
	c.d[ch.Id] = ch
}

func (c *Channels) GetByIdUnsafe(id string) (*Channel, bool) {
	ch, ok := c.d[id]
	return ch, ok
}

func (c *Channels) Drop(ch *Channel) {
	c.mx.Lock()
	defer c.mx.Unlock()

	delete(c.d, ch.Id)
}

func (c *Channels) CloseAndDropStale(past time.Duration) uint {
	c.mx.Lock()
	defer c.mx.Unlock()

	count := uint(0)

	for key, ch := range c.d {
		if ch.IsStaleDuration(past) {
			ch.Close()
			delete(c.d, key)

			count += 1
		}
	}

	return count
}
