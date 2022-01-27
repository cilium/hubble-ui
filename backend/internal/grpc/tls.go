package grpc

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/cilium/hubble-ui/backend/internal/config"
)

func TransportSecurityToRelay(cfg *config.Config) (grpc.DialOption, error) {
	if !cfg.TLSToRelayEnabled {
		return grpc.WithTransportCredentials(insecure.NewCredentials()), nil
	}

	tlsConfig, err := cfg.AsRelayClientTLSConfig()
	if err != nil {
		return nil, err
	}

	creds := credentials.NewTLS(tlsConfig)
	return grpc.WithTransportCredentials(creds), nil
}
