package server

import (
	"context"
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
	"github.com/cilium/hubble-ui/backend/proto/ui"

	"github.com/cilium/hubble-ui/backend/domain/cache"
	"github.com/cilium/hubble-ui/backend/logger"
)

var (
	log = logger.DefaultLogger
)

type UIServer struct {
	ui.UnimplementedUIServer

	relayAddr       string
	relayConnParams *grpc.ConnectParams
	hubbleClient    observer.ObserverClient
	grpcConnection  *grpc.ClientConn

	k8s       kubernetes.Interface
	dataCache *cache.DataCache
}

func New(relayAddr string) *UIServer {

	return &UIServer{
		relayAddr: relayAddr,
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
	err := srv.SetupGrpcClient()
	if err != nil {
		log.Errorf("failed to setup grpc client: %v\n", err)
		os.Exit(1)
	}

	k8s, err := createClientset()
	if err != nil {
		log.Errorf("failed to create clientset: %v\n", err)
		os.Exit(1)
	}

	srv.k8s = k8s

	return nil
}

func (srv *UIServer) SetupGrpcClient() error {
	if len(srv.relayAddr) == 0 {
		return fmt.Errorf("relayAddr is empty, flows broadcasting aborted.\n")
	}

	conn, err := grpc.Dial(
		srv.relayAddr,
		grpc.WithInsecure(),
		grpc.WithConnectParams(*srv.relayConnParams),
	)

	if err != nil {
		return err
	}

	log.Infof("hubble grpc client successfully created\n")
	srv.hubbleClient = observer.NewObserverClient(conn)
	srv.grpcConnection = conn

	return nil
}

func (srv *UIServer) RetryIfGrpcUnavailable(
	ctx context.Context,
	grpcOperation func(int) error,
) error {
	attempt := 1

	retries := srv.newRetries()
	for {
		err := retries.Wait(ctx)
		if err != nil {
			return err
		}

		err = grpcOperation(attempt)
		if err == nil {
			return nil
		}
		attempt += 1

		if srv.IsGrpcUnavailable(err) {
			log.Errorf("grpc: unavailable err: %v\n", srv.grpcConnection.GetState())
			continue
		}

		return err
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

	kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
	config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, err
	}

	return kubernetes.NewForConfig(config)
}
