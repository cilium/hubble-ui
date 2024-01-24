package router

import (
	"context"
	"sync"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/channel"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/route"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/timings"
)

type Router struct {
	log         logrus.FieldLogger
	baseContext context.Context

	tidBytesNumber int
	cidBytesNumber int
	timings        *timings.RouterTimings

	routes route.Routes

	gcOnce sync.Once
}

func (r *Router) Route(name string) *route.Route {
	existingRoute, ok := r.routes[name]
	if ok {
		return existingRoute
	}

	newRoute, err := route.Builder().
		WithKind(route.OneshotKind).
		WithName(name).
		WithBaseContext(r.baseContext).
		WithDefaultHandler(r.notImplementedHandler).
		WithTimings(r.timings).
		WithLogger(r.log.WithField("route", name)).
		Build()

	if err != nil {
		r.log.
			WithField("name", name).
			WithError(err).
			Error("cannot build route")

		panic(err.Error())
	}

	r.routes[name] = newRoute
	return newRoute
}

func (r *Router) runGarbageCollector() {
	r.gcOnce.Do(func() {
		go r.garbageCollector(r.baseContext)
	})
}

// NOTE: Since it is the client who is responsible for notifying server that channel
// should be closed, this garbage collector will ensure that we do not allow memory leak
func (r *Router) garbageCollector(ctx context.Context) {
	if r.timings.GarbageCollectionDelay == time.Duration(0) {
		r.log.Debug("router gargabe collector will not be running")
		return
	}

	ticker := time.NewTicker(r.timings.GarbageCollectionDelay)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			r.log.Debug("router garbage collector is stopped")
			return
		case <-ticker.C:
			ndropped := r.collectGarbage(ctx, r.timings.GarbageCollectionDelay)
			r.log.WithField("ndropped", ndropped).Debug("garbage collector iteration finished")
		}
	}
}

func (r *Router) collectGarbage(_ctx context.Context, maxInactivePeriod time.Duration) uint {
	ndropped := uint(0)

	for _, route := range r.routes {
		ndropped += route.CloseAndDropStaleChannels(maxInactivePeriod)
	}

	return ndropped
}

func (r *Router) notImplementedHandler(ch *channel.Channel) error {
	r.log.Warn("this route is not implemented yet")
	return nil
}
