package relay_client

import (
	"context"
	"fmt"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"

	"github.com/cilium/hubble-ui/backend/internal/config"
	"github.com/cilium/hubble-ui/backend/internal/hubble_client"

	"github.com/cilium/hubble-ui/backend/pkg/grpc_client"
)

type RelayClientInterface interface {
	grpc_client.GRPCClientInterface
	hubble_client.HubbleClientInterface
}

type RelayClient struct {
	hubble_client.GRPCHubbleClient

	cfg *config.Config
	log logrus.FieldLogger
}

func New(
	log logrus.FieldLogger,
	c *config.Config,
	gcl *grpc_client.GRPCClient,
) (*RelayClient, error) {
	if log == nil {
		return nil, nerr("log is nil")
	}

	if c == nil {
		return nil, nerr("cfg is nil")
	}

	if gcl == nil {
		return nil, nerr("GRPCClient is nil")
	}

	relayClient := new(RelayClient)
	relayClient.cfg = c
	relayClient.log = log

	hcl, err := hubble_client.New(
		gcl,
		log.WithField("hubble-client", "relay"),
		relayClient,
	)

	if err != nil {
		return nil, err
	}

	relayClient.GRPCHubbleClient = *hcl
	return relayClient, nil
}

func (rcl *RelayClient) CallOptions(ctx context.Context) []grpc.CallOption {
	return []grpc.CallOption{grpc.WaitForReady(true)}
}

// NOTE: These two methods implements PerRPCCredentials interface
func (rcl *RelayClient) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
	return map[string]string{}, nil
}

func (rcl *RelayClient) RequireTransportSecurity() bool {
	return rcl.cfg.TLSToRelayEnabled
}

func nerr(reason string) error {
	return fmt.Errorf("failed to create RelayClient: %s", reason)
}
