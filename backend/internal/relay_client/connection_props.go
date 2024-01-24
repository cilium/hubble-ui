package relay_client

import (
	"context"
	"time"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/backoff"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/cilium/hubble-ui/backend/pkg/grpc_client"

	"github.com/cilium/hubble-ui/backend/internal/config"
)

type ConnectionProps struct {
	Config *config.Config
	Log    logrus.FieldLogger
}

func (cp *ConnectionProps) Tag(ctx context.Context) (grpc_client.ConnectionTag, error) {
	return grpc_client.ConnectionTag{
		Key:      grpc_client.SharedConnectionKey,
		UserData: nil,
	}, nil
}

func (cp *ConnectionProps) Validate(prevTag, newTag *grpc_client.ConnectionTag) bool {
	return true
}

func (cp *ConnectionProps) DialOptions(ctx context.Context) ([]grpc.DialOption, error) {
	transportDialOpt, err := cp.getTransportSecurityDialOpts()
	if err != nil {
		return nil, err
	}

	connectParams := grpc.ConnectParams{
		Backoff: backoff.Config{
			BaseDelay:  1.0 * time.Second,
			Multiplier: 1.6,
			Jitter:     0.2,
			MaxDelay:   7 * time.Second,
		},
		MinConnectTimeout: 5 * time.Second,
	}

	dialOpts := []grpc.DialOption{
		transportDialOpt,
		grpc.WithConnectParams(connectParams),
	}

	return dialOpts, nil
}

func (cp *ConnectionProps) getTransportSecurityDialOpts() (grpc.DialOption, error) {
	if !cp.Config.TLSToRelayEnabled {
		return grpc.WithTransportCredentials(insecure.NewCredentials()), nil
	}

	tlsConfig, err := cp.Config.AsRelayClientTLSConfig()
	if err != nil {
		return nil, err
	}

	creds := credentials.NewTLS(tlsConfig)
	return grpc.WithTransportCredentials(creds), nil
}
