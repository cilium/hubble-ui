package hubble_client

import (
	"context"
	"fmt"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/pkg/grpc_client"

	"github.com/cilium/hubble-ui/backend/internal/flow_stream"
	"github.com/cilium/hubble-ui/backend/internal/statuschecker"
)

type HubbleClientInterface interface {
	FlowStream() flow_stream.FlowStreamInterface
	ServerStatus(context.Context) (*observer.ServerStatusResponse, error)
	ServerStatusChecker(opts StatusCheckerOptions) (statuschecker.ServerStatusCheckerInterface, error)
}

type GRPCHubbleClient struct {
	*grpc_client.GRPCClient

	callPropsProvider grpc_client.CallPropertiesProvider
	log               logrus.FieldLogger
}

func New(
	gcl *grpc_client.GRPCClient,
	log logrus.FieldLogger,
	callPropsProvider grpc_client.CallPropertiesProvider,
) (*GRPCHubbleClient, error) {
	if gcl == nil {
		return nil, nerr("grpc client is nil")
	}

	if log == nil {
		return nil, nerr("log is nil")
	}

	if callPropsProvider == nil {
		return nil, nerr("CallPropertiesProvider is nil")
	}

	return &GRPCHubbleClient{
		GRPCClient:        gcl,
		log:               log,
		callPropsProvider: callPropsProvider,
	}, nil
}

func (hc *GRPCHubbleClient) ConnectionPool() grpc_client.ConnectionPool {
	return hc.GRPCClient
}

func nerr(reason string) error {
	return fmt.Errorf(
		"failed to create GRPCHubbleClient: %s",
		reason,
	)
}
