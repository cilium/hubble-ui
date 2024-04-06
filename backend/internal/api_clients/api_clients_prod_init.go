package api_clients

import (
	"os"
	"path/filepath"

	"github.com/sirupsen/logrus"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	cilium "github.com/cilium/cilium/pkg/k8s/client/clientset/versioned"

	"github.com/cilium/hubble-ui/backend/internal/config"
	"github.com/cilium/hubble-ui/backend/internal/relay_client"

	"github.com/cilium/hubble-ui/backend/pkg/grpc_client"
)

func initK8sClientset() (*rest.Config, *kubernetes.Clientset, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)

		if err != nil {
			return nil, nil, err
		}
	}

	k8s, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, nil, err
	}

	return config, k8s, nil
}

func initCiliumClientset(k8sConfig *rest.Config) (*cilium.Clientset, error) {
	return cilium.NewForConfig(k8sConfig)
}

func initRelayGRPCClient(cfg *config.Config, log logrus.FieldLogger) (
	*grpc_client.GRPCClient, error,
) {
	return grpc_client.New(
		log,
		cfg.RelayAddr,
		&relay_client.ConnectionProps{
			Config: cfg,
			Log:    log,
		},
		nil,
	)
}
