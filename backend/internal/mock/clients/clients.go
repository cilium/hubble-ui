package clients

import (
	"context"
	"sync"

	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/api_clients"
	"github.com/cilium/hubble-ui/backend/internal/mock/sources"
	"github.com/cilium/hubble-ui/backend/internal/mock/streams"
	"github.com/cilium/hubble-ui/backend/internal/ns_watcher"
	"github.com/cilium/hubble-ui/backend/internal/relay_client"

	"github.com/cilium/hubble-ui/backend/pkg/rate_limiter"
)

// NOTE: Every ref to subclient/substream is stored, to have a way to mutate
// their state in any moment in time
type Clients struct {
	log logrus.FieldLogger
	src sources.MockedSource

	mx sync.Mutex

	flowsRateLimit rate_limiter.RateLimit

	relayGrpcClient *GRPCClient
	relayClients    []*RelayClient

	nsWatchers []*streams.NSWatcher
}

func New(ctx context.Context, log logrus.FieldLogger) api_clients.APIClientsInterface {
	return NewInner(ctx, log)
}

func NewInner(ctx context.Context, log logrus.FieldLogger) *Clients {
	return &Clients{
		log:             log,
		mx:              sync.Mutex{},
		relayGrpcClient: NewGRPCClient(log.WithField("client", "relay-grpc")),
	}
}

func (cl *Clients) SetSource(src sources.MockedSource) {
	cl.mx.Lock()
	defer cl.mx.Unlock()

	cl.src = src
}

func (cl *Clients) SetFlowsRateLimit(rl rate_limiter.RateLimit) {
	cl.mx.Lock()
	defer cl.mx.Unlock()

	cl.flowsRateLimit = rl
}

// NOTE: You need to call this method between cypress tests to have a clear state
func (cl *Clients) Reset() {
	cl.log.Info("resetting clients...")
	cl.mx.Lock()
	defer cl.mx.Unlock()

	cl.log.Info("resettings clients: lock is acquired")

	// NOTE: Relay clients
	for _, rcl := range cl.relayClients {
		rcl.Reset()
	}

	cl.relayClients = []*RelayClient{}
	cl.relayGrpcClient.Reset()

	// NOTE: NSWatchers
	for _, nsw := range cl.nsWatchers {
		nsw.Stop()
	}
	cl.nsWatchers = []*streams.NSWatcher{}

	if cl.src != nil {
		cl.src.Stop()
		cl.src = nil
	}

	cl.log.Info("clients reset completed")
}

func (cl *Clients) RelayClient() relay_client.RelayClientInterface {
	cl.mx.Lock()
	defer cl.mx.Unlock()

	log := cl.log.WithField("client", "relay").WithField("client-idx", len(cl.relayClients))
	rcl := NewRelayClient(
		log,
		cl.relayGrpcClient,
		cl.duplicateSource(),
		cl.flowsRateLimit,
	)

	cl.relayClients = append(cl.relayClients, rcl)
	return rcl
}

func (cl *Clients) NSWatcher(ctx context.Context, opts ns_watcher.NSWatcherOptions) (ns_watcher.NSWatcherInterface, error) {
	cl.mx.Lock()
	defer cl.mx.Unlock()

	log := cl.log.WithField("stream", "ns-watcher").WithField("stream-idx", len(cl.nsWatchers))
	nsw := streams.NewNSWatcher(log, cl.duplicateSource())

	cl.nsWatchers = append(cl.nsWatchers, nsw)
	return nsw, nil
}

func (cl *Clients) duplicateSource() sources.MockedSource {
	if cl.src == nil {
		return nil
	}

	return cl.src.Duplicate()
}
