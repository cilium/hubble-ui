package server

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	retries "github.com/cenkalti/backoff/v4"
	"google.golang.org/grpc"
	"google.golang.org/grpc/backoff"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/proto/ui"

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
	retryPolicy     retries.BackOff

	k8s       kubernetes.Interface
	dataCache *dataCache
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
		retryPolicy: newRetryPolicy(),
		dataCache:   newDataCache(),
	}
}

func newRetryPolicy() retries.BackOff {
	retryPolicy := retries.NewExponentialBackOff()

	retryPolicy.InitialInterval = 1.0 * time.Second
	retryPolicy.RandomizationFactor = 0.2
	retryPolicy.Multiplier = 1.6
	retryPolicy.MaxInterval = 7 * time.Second
	retryPolicy.MaxElapsedTime = 0

	return retryPolicy
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

func (srv *UIServer) RetryIfGrpcUnavailable(grpcOperation func(int) error) error {
	var unretriableError error = nil
	attempt := 0

	retryErr := retries.Retry(func() error {
		defer func() {
			attempt += 1
		}()

		err := grpcOperation(attempt)
		if err == nil {
			return nil
		}
		log.Errorf("grpc operation failed: %v\n", err)

		if status.Code(err) == codes.Unavailable {
			log.Errorf("grpc connectivity: %v\n", srv.grpcConnection.GetState())
			return err
		}

		unretriableError = err
		return nil
	}, srv.retryPolicy)

	// NOTE: case when max number of retries is set
	if retryErr != nil {
		return retryErr
	}

	return unretriableError
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
