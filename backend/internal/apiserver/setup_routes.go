package apiserver

import (
	"time"

	rcontext "github.com/cilium/hubble-ui/backend/internal/apiserver/req_context"
	cp "github.com/cilium/hubble-ui/backend/internal/customprotocol"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/router"
)

type WrappedRouteHandler func(*cp.Channel, *rcontext.Context) error
type WrappedRouteOptions struct {
	TimescapeRequired bool
}

func (srv *APIServer) prepareRoutes() error {
	routr, err := router.
		Builder().
		WithLogger(srv.log.WithField("component", "cp.Router")).
		WithBaseContext(srv.baseContext).
		WithTraceIdBytesNumber(8).
		WithChannelIdBytesNumber(8).
		WithClientPollDelays(
			srv.cfg.MinClientPollDelay,
			srv.cfg.MaxClientPollDelay,
		).
		WithRouteResumePollTimeout(10 * time.Millisecond).
		WithGarbageCollectionDelay(2 * srv.cfg.MaxClientPollDelay).
		Build()

	if err != nil {
		return err
	}

	srv.router = routr
	return srv.setRouteHandlers()
}

func (srv *APIServer) setRouteHandlers() error {
	srv.router.Route("control-stream").
		Middlewares([]cp.ChannelMiddleware{
			srv.loggerMiddleware("ControlStream"),
		}).
		Stream(
			srv.wrapHandler(srv.ControlStream, WrappedRouteOptions{}),
		)

	srv.router.Route("service-map-stream").
		Middlewares([]cp.ChannelMiddleware{
			srv.loggerMiddleware("ServiceMapStream"),
		}).
		Stream(
			srv.wrapHandler(srv.ServiceMapStream, WrappedRouteOptions{}),
		)

	return nil
}

func (srv *APIServer) wrapHandler(
	handler WrappedRouteHandler,
	_opts WrappedRouteOptions,
) cp.RouteHandler {
	return func(ch *cp.Channel) error {
		rctx, err := srv.ensureHandlerData(ch)
		if err != nil {
			return err
		}

		return handler(ch, rctx)
	}
}
