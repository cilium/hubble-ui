package server

import (
	"os"
	"path/filepath"

	"google.golang.org/grpc"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/cilium/api/v1/relay"

	"github.com/cilium/hubble-ui/events-server/logger"
)

var (
	log = logger.New("relay-server")
)

type RelayServer struct {
	relay.UnimplementedHubbleRelayServer

	hubbleAddr   string
	hubbleClient observer.ObserverClient

	k8s kubernetes.Interface
}

func New(hubbleAddr string) *RelayServer {
	return &RelayServer{hubbleAddr: hubbleAddr}
}

func (srv *RelayServer) Run() error {
	if len(srv.hubbleAddr) == 0 {
		log.Warnf("hubbleAddr is empty, flows broadcasting aborted.\n")
		return nil
	}

	conn, err := grpc.Dial(srv.hubbleAddr, grpc.WithInsecure())
	if err != nil {
		return err
	}

	log.Infof("hubble grpc client successfully created\n")

	hubbleClient := observer.NewObserverClient(conn)
	srv.hubbleClient = hubbleClient

	k8s, err := createClientset()
	if err != nil {
		log.Errorf("failed to create clientset: %v\n", err)
		os.Exit(1)
	}

	srv.k8s = k8s

	return nil
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
