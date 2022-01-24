package server

import (
	"context"

	"github.com/cilium/hubble-ui/backend/internal/server/nswatcher"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
)

func (srv *UIServer) CreateNSWatcher(
	ctx context.Context,
) (*nswatcher.Watcher, error) {
	return nswatcher.New().
		WithKubernetes(srv.k8s).
		WithLogger(logger.Sub("ns-watcher")).
		Unwrap()
}
