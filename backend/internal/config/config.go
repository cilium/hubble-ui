package config

import (
	"crypto/tls"
	"fmt"
	"time"

	"github.com/pkg/errors"
	"github.com/sirupsen/logrus"

	"github.com/cilium/cilium/pkg/crypto/certloader"
)

const (
	TLSAddrPrefix = "tls://"
)

type Config struct {
	DebugLogs bool

	GOPSEnabled bool
	GOPSPort    int

	// Enables CORS headers on http routes
	CORSEnabled bool

	E2ETestMode         bool
	E2ELogFilesBasePath string

	// The address of hubble-relay instance
	RelayAddr string

	// The port which will be used to listen to on grpc server setup
	UIServerPort uint16

	// NOTE: The delays that will be used to calculate the delay the client
	// should use for waiting between two poll requests (custom protocol).
	MinClientPollDelay time.Duration
	MaxClientPollDelay time.Duration

	TLSToRelayEnabled bool
	// The meaning of this flags is the same as in
	// https://github.com/cilium/hubble/blob/master/cmd/common/config/flags.go
	TLSRelayServerName     string
	TLSRelayCACertFiles    []string
	TLSRelayClientCertFile string
	TLSRelayClientKeyFile  string

	relayClientConfig certloader.ClientConfigBuilder
}

func New(log *logrus.Logger, propGetters PropGetters) *ConfigBuilder {
	return &ConfigBuilder{
		logger: log,
		props:  propGetters,
	}
}

func (cfg *Config) UIServerListenAddr() string {
	return fmt.Sprintf("0.0.0.0:%d", cfg.UIServerPort)
}

func (cfg *Config) AsRelayClientTLSConfig() (*tls.Config, error) {
	if cfg.relayClientConfig == nil {
		return nil, errors.New("hubble-ui backend is running with TLS disabled")
	}

	return cfg.relayClientConfig.ClientConfig(&tls.Config{
		MinVersion: tls.VersionTLS13,
		ServerName: cfg.TLSRelayServerName,
	}), nil
}
