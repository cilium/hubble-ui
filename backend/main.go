package main

import (
	"os"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/application"
	"github.com/cilium/hubble-ui/backend/internal/config"
)

func main() {
	log := logrus.New()

	cfg, err := config.New(log, config.PropGetters{
		GopsEnabled:              config.BoolOr("GOPS_ENABLED", false),
		GopsPort:                 config.Uint16Or("GOPS_PORT", 0),
		CorsEnabled:              config.BoolOr("CORS_ENABLED", false),
		DebugLogs:                config.BoolOr("DEBUG_LOGS", false),
		UIServerPort:             config.Uint16Or("EVENTS_SERVER_PORT", 8090),
		ClientPollDelays:         []time.Duration{200 * time.Millisecond, 5 * time.Second},
		RelayAddr:                config.StrOr("FLOWS_API_ADDR", "localhost:50051"),
		TLSToRelayEnabled:        config.BoolOr("TLS_TO_RELAY_ENABLED", false),
		TLSToRelayServerName:     config.StrOr("TLS_RELAY_SERVER_NAME", ""),
		TLSToRelayCACertFiles:    config.Str("TLS_RELAY_CA_CERT_FILES"),
		TLSToRelayClientCertFile: config.StrOr("TLS_RELAY_CLIENT_CERT_FILE", ""),
		TLSToRelayClientKeyFile:  config.StrOr("TLS_RELAY_CLIENT_KEY_FILE", ""),
		E2ETestModeEnabled:       config.BoolOr("E2E_TEST_MODE", false),
		E2ELogfilesBasepath:      config.StrOr("E2E_LOGFILES_BASEPATH", ""),
	}).Build()

	if err != nil {
		log.WithError(err).Error("failed to initialize application config")
		os.Exit(1)
	}

	app, err := application.New(log, cfg, application.Options{
		ApiRoute:         "/api",
		HealthCheckRoute: "/healthz",
	})

	if err != nil {
		log.WithError(err).Error("failed to initialize application")
		os.Exit(1)
	}

	if err := app.Run(); err != nil {
		log.WithError(err).Error("app.Run() terminated with error")
		os.Exit(1)
	}
}

// func runServer(cfg *config.Config) {
// 	// observerAddr := getObserverAddr()
// 	srv := server.New(cfg)
//
// 	if err := srv.Run(); err != nil {
// 		log.Errorf(msg.ServerSetupRunError, err)
// 		os.Exit(1)
// 	}
//
// 	grpcServer := grpc.NewServer()
// 	ui.RegisterUIServer(grpcServer, srv)
//
// 	wrappedGrpc := grpcweb.WrapServer(
// 		grpcServer,
// 		grpcweb.WithOriginFunc(func(origin string) bool {
// 			return true
// 		}),
// 		grpcweb.WithCorsForRegisteredEndpointsOnly(false),
// 	)
//
// 	handler := http.NewServeMux()
// 	handler.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
// 		w.WriteHeader(http.StatusOK)
// 		fmt.Fprintf(w, "ok")
// 	})
// 	handler.HandleFunc("/api/", func(resp http.ResponseWriter, req *http.Request) {
// 		// NOTE: GRPC server handles requests with URL like "ui.UI/functionName"
// 		req.URL.Path = req.URL.Path[len("/api/"):]
// 		wrappedGrpc.ServeHTTP(resp, req)
// 	})
// 	h2cHandler := h2c.NewHandler(handler, &http2.Server{})
//
// 	ctx, cancel := signal.NotifyContext(context.Background(), unix.SIGINT, unix.SIGTERM)
// 	defer cancel()
//
// 	addr := cfg.UIServerListenAddr()
//
// 	httpSrv := &http.Server{
// 		Addr:    addr,
// 		Handler: h2cHandler,
// 		BaseContext: func(net.Listener) context.Context {
// 			return ctx
// 		},
// 		ReadHeaderTimeout: 5 * time.Second,
// 	}
//
// 	go func() {
// 		<-ctx.Done()
// 		log.Info(msg.ServerSetupShuttingDown)
// 		if err := httpSrv.Shutdown(ctx); err != nil {
// 			log.WithError(err).Error("httpSrv.Shutdown error")
// 		}
// 	}()
//
// 	log.Infof(msg.ServerSetupListeningAt, addr)
// 	if err := httpSrv.ListenAndServe(); err != nil {
// 		code := 1
// 		if !errors.Is(err, http.ErrServerClosed) {
// 			log.Errorf(msg.ServerSetupRunError, err)
// 		} else {
// 			code = 0
// 		}
// 		os.Exit(code)
// 	}
// }
//
// func runGops() {
// 	if enabled, _ := strconv.ParseBool(os.Getenv("GOPS_ENABLED")); !enabled {
// 		return
// 	}
//
// 	gopsPort := "0"
// 	if gopsPortEnv := os.Getenv("GOPS_PORT"); gopsPortEnv != "" {
// 		gopsPort = gopsPortEnv
// 	}
// 	// Open socket for using gops to get stacktraces of the agent.
// 	addr := fmt.Sprintf("127.0.0.1:%s", gopsPort)
// 	addrField := logrus.Fields{"address": addr}
//
// 	if err := gops.Listen(gops.Options{
// 		Addr:                   addr,
// 		ReuseSocketAddrAndPort: true,
// 	}); err != nil {
// 		log.WithError(err).WithFields(addrField).Fatal("Cannot start gops server")
// 	}
//
// 	log.WithFields(addrField).Info("Started gops server")
// }
//
// func main() {
// 	runGops()
//
// 	cfg, err := config.Init()
// 	if err != nil {
// 		log.Errorf(msg.ServerSetupConfigInitError, err.Error())
// 		os.Exit(1)
// 	}
// }
