package clients

import (
	"context"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"

	"github.com/cilium/hubble-ui/backend/pkg/dllist"
	dchannel "github.com/cilium/hubble-ui/backend/pkg/dynamic_channel"
	"github.com/cilium/hubble-ui/backend/pkg/grpc_client"
)

type GRPCClient struct {
	log  logrus.FieldLogger
	subs *dllist.DLList[grpc_client.StatusSub]
}

func NewGRPCClient(log logrus.FieldLogger) *GRPCClient {
	return &GRPCClient{
		log:  log,
		subs: dllist.NewDLList[grpc_client.StatusSub](),
	}
}

func (g *GRPCClient) ConnStatusChannel() *dllist.ListItem[grpc_client.StatusSub] {
	dch := dchannel.New[grpc_client.ConnectionStatus]()
	sub := g.subs.Add(dch)

	return sub
}

func (g *GRPCClient) DialOptions(ctx context.Context) ([]grpc.DialOption, error) {
	return []grpc.DialOption{}, nil
}

func (g *GRPCClient) Tag(ctx context.Context) (grpc_client.ConnectionTag, error) {
	return grpc_client.ConnectionTag{
		Key:      "mock-shared-connection",
		UserData: nil,
	}, nil
}

func (g *GRPCClient) Validate(p, q *grpc_client.ConnectionTag) bool {
	return true
}

func (g *GRPCClient) CallOptions(ctx context.Context) []grpc.CallOption {
	return []grpc.CallOption{}
}

func (g *GRPCClient) Reset() {
	g.log.Info("resetting")
	defer g.log.Info("reset completed")

	g.subs.Clear()
}
