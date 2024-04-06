package application

import (
	"context"
	"fmt"
	"os/signal"
	"time"

	gops "github.com/google/gops/agent"
	"github.com/sirupsen/logrus"
	"golang.org/x/sys/unix"

	"github.com/cilium/hubble-ui/backend/internal/api_clients"
	"github.com/cilium/hubble-ui/backend/internal/apiserver"
	"github.com/cilium/hubble-ui/backend/internal/config"
	"github.com/cilium/hubble-ui/backend/internal/e2e"
)

type Application struct {
	cfg  *config.Config
	log  logrus.FieldLogger
	opts Options

	e2e *e2e.TestsController

	clients api_clients.APIClientsInterface
	srv     *apiserver.APIServer
}

type Options struct {
	ApiRoute         string
	HealthCheckRoute string
}

func New(log logrus.FieldLogger, cfg *config.Config, opts Options) (*Application, error) {
	return &Application{
		cfg:  cfg,
		log:  log,
		opts: opts,
	}, nil
}

func (app *Application) Run() error {
	if err := app.runGops(); err != nil {
		return err
	}

	// NOTE: This call will run dedicated goroutine for watching process signals
	ctx := app.onTerminateOrInterruptSignal(func() {
		app.GracefulShutdown()
	})

	if app.cfg.E2ETestMode {
		app.e2e = e2e.NewTestsController(
			ctx,
			app.log.WithField("component", "e2e.TestsController"),
			app.cfg.E2ELogFilesBasePath,
		)

		app.clients = app.e2e.GetClients()

		app.log.WithFields(app.e2e.LogFields()).Info("backend is running in e2e test mode")

	} else {
		// FIXME: make the dial timeout configurable
		dialCtx, cancelDial := context.WithTimeout(ctx, 10*time.Second)
		defer cancelDial()

		prodClients, err := api_clients.New(
			dialCtx,
			app.cfg,
			app.log.WithField("component", "APIClients"),
		)

		if err != nil {
			return err
		}

		app.clients = prodClients
	}

	handlerMiddleware := app.e2e.HandlerMiddleware
	if !app.cfg.E2ETestMode {
		handlerMiddleware = nil
	}

	srv, err := apiserver.New(
		ctx,
		app.log.WithField("component", "APIServer"),
		app.cfg,
		int(app.cfg.UIServerPort),
		app.opts.ApiRoute,
		app.clients,
		handlerMiddleware,
	)

	if err != nil {
		return err
	}

	app.srv = srv

	if err := srv.Listen(); err != nil {
		app.log.WithError(err).Error("APIServer listen call failed")
		return err
	}

	return nil
}

func (app *Application) runGops() error {
	if !app.cfg.GOPSEnabled {
		return nil
	}

	// Open socket for using gops to get stacktraces of the agent.
	addr := fmt.Sprintf("127.0.0.1:%d", app.cfg.GOPSPort)
	addrField := logrus.Fields{"address": addr}

	if err := gops.Listen(gops.Options{
		Addr:                   addr,
		ReuseSocketAddrAndPort: true,
	}); err != nil {
		app.log.
			WithError(err).
			WithFields(addrField).
			Error("Cannot start gops server")

		return err
	}

	app.log.WithFields(addrField).Info("started gops server")
	return nil
}

func (app *Application) onTerminateOrInterruptSignal(fn func()) context.Context {
	ctx, reset := signal.NotifyContext(
		context.Background(),
		unix.SIGINT,
		unix.SIGTERM,
	)

	// NOTE: Perhaps running this gorouting is not necessary in case if
	// onShutdown is running after everything is running...
	go (func() {
		<-ctx.Done()

		app.log.Debug("SIGINT or SIGTERM received")
		fn()

		reset()
	})()

	return ctx
}

func (app *Application) GracefulShutdown() {
	app.log.Info("shutting down the Application gracefully")

	if err := app.srv.Shutdown(); err != nil {
		app.log.WithError(err).Warn("server shutdown error")
	}

	app.stopGops()
}

func (app *Application) stopGops() {
	if !app.cfg.GOPSEnabled {
		return
	}

	app.log.Info("stopping GOPS server")
	gops.Close()
}
