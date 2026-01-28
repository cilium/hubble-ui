package clients

import (
	"log/slog"

	"github.com/cilium/hubble-ui/backend/internal/mock/sources"

	"github.com/cilium/hubble-ui/backend/pkg/rate_limiter"
)

type RelayClient struct {
	*GRPCClient
	*HubbleClient

	log *slog.Logger
	src sources.MockedSource
}

func NewRelayClient(
	log *slog.Logger,
	gcl *GRPCClient,
	src sources.MockedSource,
	flowsRateLimit rate_limiter.RateLimit,
) *RelayClient {
	return &RelayClient{
		GRPCClient: gcl,
		HubbleClient: NewHubbleClient(
			log.With(slog.String("subclient", "hubble")),
			gcl,
			src,
			flowsRateLimit,
		),
		log: log,
		src: src,
	}
}

func (rcl *RelayClient) Reset() {
	rcl.HubbleClient.Reset()
}
