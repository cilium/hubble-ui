package grpc_client

import (
	"context"

	"google.golang.org/grpc"
)

type ConnectionPool interface {
	GetStableConnection(context.Context) (*grpc.ClientConn, error)
	Reconnect(context.Context) (*grpc.ClientConn, error)
}
