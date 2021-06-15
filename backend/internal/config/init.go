package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/cilium/cilium/pkg/crypto/certloader"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
)

const (
	UIServerDefaultPort = "8090"
)

func Init() (*Config, error) {
	cfg := &Config{}

	setupRelayAddr(cfg)
	setupUIServerPort(cfg)

	if err := setupTLSOptions(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

func setupRelayAddr(cfg *Config) {
	relayAddr, ok := os.LookupEnv("FLOWS_API_ADDR")
	if !ok {
		relayAddr = "localhost:50051"
		log.Warnf(msg.ServerSetupUsingDefRelayAddr, relayAddr)
	}

	cfg.RelayAddr = relayAddr
}

func setupUIServerPort(cfg *Config) {
	port, ok := os.LookupEnv("EVENTS_SERVER_PORT")
	if !ok {
		port = UIServerDefaultPort
		log.Warnf(msg.ServerSetupUsingDefPort, port)
	}

	cfg.UIServerPort = port
}

func setupTLSOptions(cfg *Config) error {
	tlsEnabledStr, _ := os.LookupEnv("TLS_TO_RELAY_ENABLED")
	tlsServerName, _ := os.LookupEnv("TLS_RELAY_SERVER_NAME")
	tlsAllowInsecureStr, _ := os.LookupEnv("TLS_TO_RELAY_ALLOW_INSECURE")
	tlsCACertFiles, _ := os.LookupEnv("TLS_RELAY_CA_CERT_FILES")
	tlsClientCertFile, _ := os.LookupEnv("TLS_RELAY_CLIENT_CERT_FILE")
	tlsClientKeyFile, _ := os.LookupEnv("TLS_RELAY_CLIENT_KEY_FILE")

	cfg.TLSRelayServerName = tlsServerName

	tlsAllowInsecure, _ := strconv.ParseBool(tlsAllowInsecureStr)
	if tlsAllowInsecure {
		log.Warnf(msg.ServerSetupTLSAllowInsecureDef, tlsAllowInsecure)
	}

	tlsToRelayEnabled, _ := strconv.ParseBool(tlsEnabledStr)

	cfg.TLSToRelayEnabled = tlsToRelayEnabled
	cfg.TLSToRelayAllowInsecure = tlsAllowInsecure
	cfg.TLSRelayCACertFiles = make([]string, 0)
	for _, caCertPath := range strings.Split(tlsCACertFiles, ",") {
		trimmed := strings.TrimSpace(caCertPath)
		if len(trimmed) == 0 {
			continue
		}

		cfg.TLSRelayCACertFiles = append(cfg.TLSRelayCACertFiles, trimmed)
	}

	cfg.TLSRelayClientCertFile = tlsClientCertFile
	cfg.TLSRelayClientKeyFile = tlsClientKeyFile

	tlsState := "disabled"
	if tlsToRelayEnabled {
		tlsState = "enabled"
	}

	log.Infof(msg.ServerSetupTLSInitState, tlsState)

	if !tlsToRelayEnabled {
		return nil
	}

	relayClientConfig, err := certloader.NewWatchedClientConfig(
		logger.New("tls-config-watcher"),
		cfg.TLSRelayCACertFiles,
		cfg.TLSRelayClientCertFile,
		cfg.TLSRelayClientKeyFile,
	)

	if err != nil {
		return err
	}

	cfg.relayClientConfig = relayClientConfig
	log.Infof(msg.ServerSetupTLSInitWithNCACerts, len(cfg.TLSRelayCACertFiles))

	return nil
}
