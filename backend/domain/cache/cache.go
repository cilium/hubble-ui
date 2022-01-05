package cache

import (
	"github.com/cilium/hubble-ui/backend/domain/link"
	"github.com/cilium/hubble-ui/backend/domain/service"

	"github.com/cilium/cilium/pkg/lock"
)

type DataCache struct {
	lock.Mutex
	services map[string]*service.Service
	links    map[string]*link.Link
}

type CacheFlags struct {
	Created bool
	Updated bool
	Deleted bool
	Exists  bool
}

func New() *DataCache {
	return &DataCache{
		services: make(map[string]*service.Service),
		links:    make(map[string]*link.Link),
	}
}

func (c *DataCache) Drop() {
	c.Mutex.Lock()
	defer c.Mutex.Unlock()
	c.services = make(map[string]*service.Service)
	c.links = make(map[string]*link.Link)
}

func (c *DataCache) UpsertService(svc *service.Service) *CacheFlags {
	flags := new(CacheFlags)
	svcId := svc.Id()

	c.Mutex.Lock()
	defer c.Mutex.Unlock()

	_, exists := c.services[svcId]
	if !exists {
		c.services[svcId] = svc
		flags.Created = true
	} else {
		flags.Exists = true
	}

	return flags
}

func (c *DataCache) UpsertServiceLink(newLink *link.Link) *CacheFlags {
	flags := new(CacheFlags)

	c.Mutex.Lock()
	defer c.Mutex.Unlock()
	currentLink, exists := c.links[newLink.Id]
	if !exists {
		c.links[newLink.Id] = newLink
		flags.Created = true

		return flags
	}

	if currentLink.Equals(newLink) {
		flags.Exists = true
		return flags
	}

	flags.Updated = true
	// NOTE: the only thing that can differ is Verdict
	c.links[newLink.Id] = newLink
	return flags
}

func (c *DataCache) ForEachService(cb func(key string, svc *service.Service)) {
	c.Lock()
	defer c.Unlock()

	for key, svc := range c.services {
		cb(key, svc)
	}
}

func (c *DataCache) ForEachLink(cb func(key string, link *link.Link)) {
	c.Lock()
	defer c.Unlock()

	for key, l := range c.links {
		cb(key, l)
	}
}

func (cf *DataCache) Empty() *DataCache {
	return New()
}

func (cf *CacheFlags) Changed() bool {
	return cf.Created || cf.Updated || cf.Deleted
}
