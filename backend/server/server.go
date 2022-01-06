package server

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/backoff"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	"github.com/cilium/cilium/api/v1/observer"
	cilium_backoff "github.com/cilium/cilium/pkg/backoff"
	grpc_helpers "github.com/cilium/hubble-ui/backend/internal/grpc"
	"github.com/cilium/hubble-ui/backend/proto/ui"

	"github.com/cilium/hubble-ui/backend/domain/cache"
	"github.com/cilium/hubble-ui/backend/internal/config"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
)

var (
	log = logger.DefaultLogger
)

type UIServer struct {
	ui.UnimplementedUIServer

	cfg             *config.Config
	relayConnParams *grpc.ConnectParams

	k8s       kubernetes.Interface
	dataCache *cache.DataCache
}

type HubbleClient struct {
	hubble         observer.ObserverClient
	grpcConnection *grpc.ClientConn
}

func New(cfg *config.Config) *UIServer {
	return &UIServer{
		cfg: cfg,
		relayConnParams: &grpc.ConnectParams{
			Backoff: backoff.Config{
				BaseDelay:  1.0 * time.Second,
				Multiplier: 1.6,
				Jitter:     0.2,
				MaxDelay:   7 * time.Second,
			},
			MinConnectTimeout: 5 * time.Second,
		},
		dataCache: cache.New(),
	}
}

func (srv *UIServer) newRetries() *cilium_backoff.Exponential {
	return &cilium_backoff.Exponential{
		Min:    1.0 * time.Second,
		Max:    7.0 * time.Second,
		Factor: 1.6,
		Jitter: true,
	}
}

func (srv *UIServer) Run() error {
	k8s, err := createClientset()
	if err != nil {
		log.Errorf(msg.ServerSetupK8sClientsetError, err)
		os.Exit(1)
	}

	srv.k8s = k8s

	return nil
}

func (srv *UIServer) GetHubbleClientFromContext(ctx context.Context) (
	*HubbleClient, error,
) {
	relayAddr := srv.cfg.RelayAddr
	if len(relayAddr) == 0 {
		return nil, fmt.Errorf(msg.ServerSetupNoRelayAddrError)
	}

	transportDialOpt, err := grpc_helpers.TransportSecurityToRelay(srv.cfg)
	if err != nil {
		return nil, err
	}

	dialOpts := []grpc.DialOption{
		transportDialOpt,
		grpc.WithConnectParams(*srv.relayConnParams),
	}

	conn, err := grpc.Dial(relayAddr, dialOpts...)
	if err != nil {
		return nil, err
	}

	log.Infof(msg.ServerSetupRelayClientReady, relayAddr)

	return &HubbleClient{
		hubble:         observer.NewObserverClient(conn),
		grpcConnection: conn,
	}, nil
}

func (srv *UIServer) RetryIfGrpcUnavailable(
	ctx context.Context,
	grpcOperation func(int) error,
) error {
	attempt := 1

	retries := srv.newRetries()
	for {
		err := grpcOperation(attempt)
		if err == nil {
			return nil
		}

		if !srv.IsGrpcUnavailable(err) {
			return err
		}

		attempt++
		err = retries.Wait(ctx)
		if err != nil {
			return err
		}
	}
}

func (srv *UIServer) IsGrpcUnavailable(err error) bool {
	return status.Code(err) == codes.Unavailable
}

func createClientset() (kubernetes.Interface, error) {
	config, err := rest.InClusterConfig()
	if err == nil {
		return kubernetes.NewForConfig(config)
	}

	kubeconfig, err := kubeconfigLocation()
	if err != nil {
		return nil, err
	}

	config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, err
	}

	return kubernetes.NewForConfig(config)
}

func kubeconfigLocation() (string, error) {
	value, present := os.LookupEnv("KUBECONFIG")
	if present == true {
		fileExist, err := exists(value)
		if err != nil {
			return "", err
		}
		if fileExist == true {
			return value, nil
		}
	}
	return filepath.Join(os.Getenv("HOME"), ".kube", "config"), nil
}

func exists(name string) (bool, error) {
	_, err := os.Stat(name)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, os.ErrNotExist) {
		return false, nil
	}
	return false, err
}
