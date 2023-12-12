package cache

import (
	"sync"

	"github.com/cilium/hubble-ui/backend/domain/events"
	"github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/link"
	"github.com/cilium/hubble-ui/backend/domain/service"
)

type DataCache struct {
	mx       sync.Mutex
	services map[string]*service.Service
	links    map[string]*link.Link
}

type Result[T any] struct {
	Entry     T
	EventKind events.EventKind
}

func New() *DataCache {
	return &DataCache{
		mx:       sync.Mutex{},
		services: make(map[string]*service.Service),
		links:    make(map[string]*link.Link),
	}
}

func (c *DataCache) Drop() {
	c.mx.Lock()
	defer c.mx.Unlock()

	c.services = make(map[string]*service.Service)
	c.links = make(map[string]*link.Link)
}

func (c *DataCache) UpsertServicesFromFlows(
	flows []*flow.Flow,
) []Result[*service.Service] {
	results := make([]Result[*service.Service], 0)

	for _, f := range flows {
		sender, receiver := f.BuildServices()

		if sender.Id() != "0" {
			if flag := c.UpsertService(sender); flag.IsChanged() {
				results = append(results, Result[*service.Service]{
					Entry:     sender,
					EventKind: flag,
				})
			}
		}

		if receiver.Id() != "0" {
			if flag := c.UpsertService(receiver); flag.IsChanged() {
				results = append(results, Result[*service.Service]{
					Entry:     receiver,
					EventKind: flag,
				})
			}
		}
	}

	return results
}

func (c *DataCache) UpsertLinksFromFlows(
	flows []*flow.Flow,
) []Result[*link.Link] {
	links := make([]Result[*link.Link], 0)

	for _, f := range flows {
		svcLink := link.FromFlowProto(f.Ref())
		if svcLink == nil {
			continue
		}

		if flags := c.UpsertServiceLink(svcLink); flags.IsChanged() {
			links = append(links, Result[*link.Link]{
				Entry:     svcLink,
				EventKind: flags,
			})
		}
	}

	return links
}

func (c *DataCache) UpsertService(newSvc *service.Service) events.EventKind {
	svcId := newSvc.Id()

	if svcId == "0" {
		return events.Unknown
	}

	c.mx.Lock()
	defer c.mx.Unlock()

	currentSvc, exists := c.services[svcId]

	switch {
	case !exists:
		c.services[svcId] = newSvc
		return events.Added
	case currentSvc.IsEnrichedWith(newSvc):
		c.services[svcId] = newSvc
		return events.Modified
	default:
		return events.Exists
	}
}

func (c *DataCache) UpsertServiceLink(newLink *link.Link) events.EventKind {
	c.mx.Lock()
	defer c.mx.Unlock()

	currentLink, exists := c.links[newLink.Id]
	if !exists {
		c.links[newLink.Id] = newLink
		return events.Added
	}

	// TODO: Need to find where this accumulation can happen
	// newLink.AccumulateLink(currentLink)
	if currentLink.Equals(newLink) {
		return events.Exists
	}

	// NOTE: the only thing that can differ is Verdict
	c.links[newLink.Id] = newLink
	return events.Modified
}

func (c *DataCache) ForEachService(cb func(key string, svc *service.Service)) {
	c.mx.Lock()
	defer c.mx.Unlock()

	for key, svc := range c.services {
		cb(key, svc)
	}
}

func (c *DataCache) ForEachLink(cb func(key string, link *link.Link)) {
	c.mx.Lock()
	defer c.mx.Unlock()

	for key, l := range c.links {
		cb(key, l)
	}
}
