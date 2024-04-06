package apiserver

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"time"

	"github.com/julienschmidt/httprouter"
	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/api_clients"
	"github.com/cilium/hubble-ui/backend/internal/apiserver/cors"
	"github.com/cilium/hubble-ui/backend/internal/config"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/router"
)

type APIServer struct {
	log logrus.FieldLogger
	cfg *config.Config

	port              int
	rootRoute         string
	baseContext       context.Context
	clients           api_clients.APIClientsInterface
	handlerMiddleware HttpHandlerMiddleware

	instance *http.Server
	router   *router.Router
}

type HttpHandlerMiddleware = func(http.Handler) http.Handler

func New(
	//nolint:contextcheck
	bctx context.Context,
	log logrus.FieldLogger,
	cfg *config.Config,
	port int,
	rootRoute string,
	clients api_clients.APIClientsInterface,
	handlerMiddleware HttpHandlerMiddleware,
) (*APIServer, error) {
	if log == nil {
		return nil, nerr("log is nil")
	}

	if cfg == nil {
		return nil, nerr("cfg is nil")
	}

	if port == 0 {
		return nil, nerr("port cannot be equal to 0")
	}

	if len(rootRoute) == 0 {
		return nil, nerr("rootRoute is empty")
	}

	if clients == nil {
		return nil, nerr("clients is nil")
	}

	if bctx == nil {
		log.Warn("bctx is nil, default background context will be used")
		bctx = context.Background()
	}

	srv := &APIServer{
		log:               log,
		cfg:               cfg,
		port:              port,
		rootRoute:         rootRoute,
		baseContext:       bctx,
		clients:           clients,
		handlerMiddleware: handlerMiddleware,
	}

	if err := srv.prepareRoutes(); err != nil {
		return nil, err
	}

	return srv, nil
}

func (srv *APIServer) Listen() error {
	port := srv.port
	addr := fmt.Sprintf("0.0.0.0:%d", port)
	rootRoute := fmt.Sprintf("%s/:RouteName", srv.rootRoute)

	mux := httprouter.New()
	mux.Handler(http.MethodPost, rootRoute, srv.router)

	var handler http.Handler = mux
	if srv.cfg.CORSEnabled {
		corsServer := cors.WrapHandler(handler, cors.Options{})

		mux.GlobalOPTIONS = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			corsServer.HandlePreflight(w, r)
		})

		handler = corsServer
	}

	if srv.handlerMiddleware != nil {
		handler = srv.handlerMiddleware(handler)
	}

	srv.instance = &http.Server{
		Addr:    addr,
		Handler: handler,
		BaseContext: func(net.Listener) context.Context {
			return srv.baseContext
		},
		ReadHeaderTimeout: 5 * time.Second,
	}

	srv.log.
		WithField("port", port).
		WithField("apipath", srv.rootRoute).
		Info("running ListenAndServe")

	if err := srv.instance.ListenAndServe(); err != nil {
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}

		return err
	}

	return nil
}

func (srv *APIServer) Shutdown() error {
	if srv.instance == nil {
		return nil
	}

	return srv.instance.Shutdown(srv.baseContext)
}

func nerr(reason string) error {
	return fmt.Errorf("failed to create APIServer: %s", reason)
}
