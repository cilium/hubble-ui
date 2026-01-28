package api_clients

import (
	"context"
	"log/slog"

	"github.com/pkg/errors"
	"k8s.io/client-go/kubernetes"

	cilium "github.com/cilium/cilium/pkg/k8s/client/clientset/versioned"

	"github.com/cilium/hubble-ui/backend/internal/config"
	"github.com/cilium/hubble-ui/backend/internal/ns_watcher"
	"github.com/cilium/hubble-ui/backend/internal/relay_client"
	"github.com/cilium/hubble-ui/backend/pkg/grpc_client"
)

type APIClients struct {
	cfg *config.Config
	log *slog.Logger

	k8s    kubernetes.Interface
	cilium *cilium.Clientset

	// TODO: GRPCClient can be refactored to be a generalized connection pool
	// for both Relay/Timescape clients
	relayGrpc *grpc_client.GRPCClient
}

func New(
	ctx context.Context,
	cfg *config.Config,
	log *slog.Logger,
) (*APIClients, error) {
	clients := &APIClients{
		cfg: cfg,
		log: log,
	}

	k8sConfig, k8s, err := initK8sClientset()
	if err != nil {
		return nil, errors.Wrap(err, "k8s clientset init failed")
	}

	clients.k8s = k8s

	ciliumClientset, err := initCiliumClientset(k8sConfig)
	if err != nil {
		return nil, errors.Wrap(err, "cilium clientset init failed")
	}

	clients.cilium = ciliumClientset

	relayGrpc, err := initRelayGRPCClient(cfg, log.With(slog.String("grpc-client", "relay")))
	if err != nil {
		return nil, errors.Wrap(err, "relay grpc client init failed")
	}

	clients.relayGrpc = relayGrpc
	return clients, nil
}

func (c *APIClients) NSWatcher(ctx context.Context, opts ns_watcher.NSWatcherOptions) (
	ns_watcher.NSWatcherInterface, error,
) {
	return ns_watcher.New(opts.Log, c.k8s)
}

func (c *APIClients) RelayClient() relay_client.RelayClientInterface {
	cl, err := relay_client.New(
		c.log.With(slog.String("component", "RelayClient")),
		c.cfg,
		c.relayGrpc,
	)

	if err != nil {
		c.log.Error("failed to create relay client", "error", err)
		panic(err)
	}

	return cl
}
