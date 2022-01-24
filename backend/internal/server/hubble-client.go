package server

import (
	"github.com/cilium/cilium/api/v1/observer"
	"google.golang.org/grpc"
)

type HubbleClient struct {
	Handle         observer.ObserverClient
	grpcConnection *grpc.ClientConn
}

func NewHubbleClient(conn *grpc.ClientConn) *HubbleClient {
	return &HubbleClient{
		Handle:         observer.NewObserverClient(conn),
		grpcConnection: conn,
	}
}

func (cl *HubbleClient) Close() error {
	return cl.grpcConnection.Close()
}
