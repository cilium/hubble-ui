package clients

import (
	"context"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/flow_stream"
	"github.com/cilium/hubble-ui/backend/internal/hubble_client"
	"github.com/cilium/hubble-ui/backend/internal/mock/sources"
	"github.com/cilium/hubble-ui/backend/internal/mock/streams"
	"github.com/cilium/hubble-ui/backend/internal/statuschecker"
	"github.com/cilium/hubble-ui/backend/pkg/rate_limiter"
)

type HubbleClient struct {
	*GRPCClient

	log logrus.FieldLogger
	src sources.MockedSource

	flowStreams          []*streams.FlowStream
	flowsRateLimit       rate_limiter.RateLimit
	statusCheckerStreams []*streams.StatusChecker
}

func NewHubbleClient(
	log logrus.FieldLogger,
	gcl *GRPCClient,
	src sources.MockedSource,
	flowsRateLimit rate_limiter.RateLimit,
) *HubbleClient {
	return &HubbleClient{
		GRPCClient:           gcl,
		log:                  log,
		src:                  src,
		flowStreams:          []*streams.FlowStream{},
		flowsRateLimit:       flowsRateLimit,
		statusCheckerStreams: []*streams.StatusChecker{},
	}
}

func (hcl *HubbleClient) FlowStream() flow_stream.FlowStreamInterface {
	log := hcl.log.WithField("stream", "flows").WithField("stream-idx", len(hcl.flowStreams))

	fs := streams.NewFlowStream(log, hcl.duplicateSource(), hcl.flowsRateLimit)
	hcl.flowStreams = append(hcl.flowStreams, fs)

	return fs
}

func (hcl *HubbleClient) ServerStatus(ctx context.Context) (*observer.ServerStatusResponse, error) {
	return nil, nil
}

func (hcl *HubbleClient) ServerStatusChecker(
	opts hubble_client.StatusCheckerOptions,
) (statuschecker.ServerStatusCheckerInterface, error) {
	log := hcl.log.
		WithField("stream", "status-checker").
		WithField("stream-idx", len(hcl.statusCheckerStreams))

	sc := streams.NewStatusChecker(log)
	hcl.statusCheckerStreams = append(hcl.statusCheckerStreams, sc)

	return sc, nil
}

func (hcl *HubbleClient) Reset() {
	for _, fs := range hcl.flowStreams {
		fs.Stop()
	}
	clear(hcl.flowStreams)

	for _, chkr := range hcl.statusCheckerStreams {
		chkr.Stop()
	}
	clear(hcl.statusCheckerStreams)
}

func (hcl *HubbleClient) duplicateSource() sources.MockedSource {
	if hcl.src == nil {
		return nil
	}

	return hcl.src.Duplicate()
}
