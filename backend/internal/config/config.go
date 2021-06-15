package config

import (
	"crypto/tls"
	"fmt"

	"github.com/pkg/errors"

	"github.com/cilium/cilium/pkg/crypto/certloader"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
)

var (
	log = logger.New("config")

	CACertLoadError    = errors.New("failed to read CA certificate")
	CACertInvalidError = errors.New("CA certificate is not properly PEM-encoded")
)

const (
	TLSAddrPrefix = "tls://"
)

type Config struct {
	// The address of hubble-relay instance
	RelayAddr string

	// The port which will be used to listen to on grpc server setup
	UIServerPort string

	TLSToRelayEnabled bool
	// The meaning of this flags is the same as in
	// https://github.com/cilium/hubble/blob/master/cmd/common/config/flags.go
	TLSToRelayAllowInsecure bool
	TLSRelayServerName      string
	TLSRelayCACertFiles     []string
	TLSRelayClientCertFile  string
	TLSRelayClientKeyFile   string

	relayClientConfig certloader.ClientConfigBuilder
}

func (cfg *Config) UIServerListenAddr() string {
	return fmt.Sprintf("0.0.0.0:%s", cfg.UIServerPort)
}

func (cfg *Config) AsRelayClientTLSConfig() (*tls.Config, error) {
	if cfg.relayClientConfig == nil {
		return nil, errors.New("hubble-ui backend is running with TLS disabled")
	}

	return cfg.relayClientConfig.ClientConfig(&tls.Config{
		InsecureSkipVerify: cfg.TLSToRelayAllowInsecure,
		ServerName:         cfg.TLSRelayServerName,
	}), nil
}
