package clients

import (
	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/mock/sources"

	"github.com/cilium/hubble-ui/backend/pkg/rate_limiter"
)

type RelayClient struct {
	*GRPCClient
	*HubbleClient

	log logrus.FieldLogger
	src sources.MockedSource
}

func NewRelayClient(
	log logrus.FieldLogger,
	gcl *GRPCClient,
	src sources.MockedSource,
	flowsRateLimit rate_limiter.RateLimit,
) *RelayClient {
	return &RelayClient{
		GRPCClient: gcl,
		HubbleClient: NewHubbleClient(
			log.WithField("subclient", "hubble"),
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
