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
		FlowsThrottleDelay:       config.DurationOr("FLOWS_THROTTLE_DELAY", 100*time.Millisecond),
		FlowsThrottleSize:        config.Uint64Or("FLOWS_THROTTLE_SIZE", 5000),
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
