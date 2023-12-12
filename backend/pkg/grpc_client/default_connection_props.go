package grpc_client

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// NOTE: This struct implements `ConnectionPropertiesProvider`
type DefaultConnectionProps struct{}

func (dcp *DefaultConnectionProps) DialOptions(_ context.Context) ([]grpc.DialOption, error) {
	return []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	}, nil
}

func (dcp *DefaultConnectionProps) Tag(ctx context.Context) (ConnectionTag, error) {
	return ConnectionTag{
		Key:      SharedConnectionKey,
		UserData: nil,
	}, nil
}

func (dcp *DefaultConnectionProps) Validate(prev, next *ConnectionTag) bool {
	// NOTE: Connection is always valid and can be reused
	return true
}
