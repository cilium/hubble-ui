package config

import (
	"log/slog"

	"github.com/cilium/cilium/pkg/crypto/certloader"
	"github.com/cilium/cilium/pkg/logging"
	"github.com/pkg/errors"
)

type ConfigBuilder struct {
	logger *slog.Logger
	props  PropGetters
}

func (b *ConfigBuilder) Build() (*Config, error) {
	cfg := new(Config)

	if err := b.initLogger(); err != nil {
		return nil, err
	}

	if err := b.initGOPS(cfg); err != nil {
		return nil, err
	}

	if err := b.initRelay(cfg); err != nil {
		return nil, err
	}

	if err := b.initServerPort(cfg); err != nil {
		return nil, err
	}

	if err := b.initTLSToRelay(cfg); err != nil {
		return nil, err
	}

	if err := b.initWebServer(cfg); err != nil {
		return nil, err
	}

	if err := b.initTestModeFlags(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (b *ConfigBuilder) initLogger() error {
	if b.logger == nil {
		return b.err("logger")
	}

	debugLogsEnabled := b.props.DebugLogs()
	if err := debugLogsEnabled.Err(); err != nil {
		return err
	}

	if debugLogsEnabled.Value {
		logging.SetLogLevelToDebug()
		b.logger.Debug("debug logs enabled")
	}

	return nil
}

func (b *ConfigBuilder) initGOPS(cfg *Config) error {
	isEnabled := b.props.GopsEnabled()
	if err := isEnabled.Err(); err != nil {
		return err
	}

	isEnabled.LogIfFallback(b.logger)
	if !isEnabled.Value {
		return nil
	}

	port := b.props.GopsPort()
	if err := port.Err(); err != nil {
		return err
	}

	port.LogIfFallback(b.logger)
	b.logger.Info("gops is enabled", "port", port.Value)

	cfg.GOPSEnabled = isEnabled.Value
	cfg.GOPSPort = int(port.Value)

	return nil
}

func (b *ConfigBuilder) initRelay(cfg *Config) error {
	addr := b.props.RelayAddr()
	if err := addr.Err(); err != nil {
		return err
	}

	addr.LogIfFallback(b.logger)
	cfg.RelayAddr = addr.Value

	return nil
}

func (b *ConfigBuilder) initServerPort(cfg *Config) error {
	port := b.props.UIServerPort()
	if err := port.Err(); err != nil {
		return err
	}

	port.LogIfFallback(b.logger)
	cfg.UIServerPort = port.Value

	return nil
}

func (b ConfigBuilder) initTLSToRelay(cfg *Config) error {
	isEnabled := b.props.TLSToRelayEnabled()
	if err := isEnabled.Err(); err != nil {
		return err
	}

	isEnabled.LogIfFallback(b.logger)

	if !isEnabled.Value {
		b.logger.Info("TLS to hubble-relay is not enabled")
		return nil
	}

	serverName := b.props.TLSToRelayServerName()
	if err := serverName.Err(); err != nil {
		return err
	}

	caCerts := b.props.TLSToRelayCACertFiles()
	if err := caCerts.Err(); err != nil {
		return err
	}

	clientCert := b.props.TLSToRelayClientCertFile()
	if err := clientCert.Err(); err != nil {
		return err
	}

	clientKey := b.props.TLSToRelayClientKeyFile()
	if err := clientKey.Err(); err != nil {
		return err
	}

	serverName.LogIfFallback(b.logger)
	caCerts.LogIfFallback(b.logger)
	clientCert.LogIfFallback(b.logger)
	clientKey.LogIfFallback(b.logger)

	cfg.TLSRelayServerName = serverName.Value
	cfg.TLSToRelayEnabled = isEnabled.Value
	cfg.TLSRelayCACertFiles = b.separatedStringList(caCerts.Value, ",")
	cfg.TLSRelayClientCertFile = clientCert.Value
	cfg.TLSRelayClientKeyFile = clientKey.Value

	slogLogger := logging.DefaultSlogLogger.With(slog.String("component", "tls-config-watcher"))
	relayClientConfig, err := certloader.NewWatchedClientConfig(
		slogLogger,
		cfg.TLSRelayCACertFiles,
		cfg.TLSRelayClientCertFile,
		cfg.TLSRelayClientKeyFile,
	)

	if err != nil {
		return err
	}

	cfg.relayClientConfig = relayClientConfig
	b.logger.Info("initialized with TLS to hubble-relay enabled",
		"ca-certs", cfg.TLSRelayCACertFiles,
		"client-cert", cfg.TLSRelayClientCertFile,
		"client-key", cfg.TLSRelayClientKeyFile,
		"server-name", cfg.TLSRelayServerName)

	return nil
}

func (b *ConfigBuilder) initWebServer(cfg *Config) error {
	delays := b.props.ClientPollDelays
	if len(delays) != 2 {
		return b.err("client poll delays")
	}

	cfg.MinClientPollDelay = delays[0]
	cfg.MaxClientPollDelay = delays[1]

	if cfg.MinClientPollDelay == 0 {
		return errors.New("MinClientPollDelay is not set")
	}

	if cfg.MaxClientPollDelay == 0 {
		return errors.New("MaxClientPollDelay is not set")
	}

	corsEnabled := b.props.CorsEnabled()
	if err := corsEnabled.Err(); err != nil {
		return err
	}

	corsEnabled.LogIfFallback(b.logger)
	cfg.CORSEnabled = corsEnabled.Value

	return nil
}

func (b *ConfigBuilder) initTestModeFlags(cfg *Config) error {
	e2eMode := b.props.E2ETestModeEnabled()
	if err := e2eMode.Err(); err != nil {
		return err
	}

	logFiles := b.props.E2ELogfilesBasepath()
	if err := logFiles.Err(); err != nil {
		return err
	}

	e2eMode.LogIfFallback(b.logger)
	logFiles.LogIfFallback(b.logger)

	cfg.E2ETestMode = e2eMode.Value
	cfg.E2ELogFilesBasePath = logFiles.Value

	return nil
}
