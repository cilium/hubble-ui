package hubble_client

import (
	"context"
	"log/slog"
	"time"

	"github.com/cilium/cilium/api/v1/observer"

	"github.com/cilium/hubble-ui/backend/internal/flow_stream"
	"github.com/cilium/hubble-ui/backend/internal/statuschecker"
)

func (c *GRPCHubbleClient) FlowStream() flow_stream.FlowStreamInterface {
	// NOTE: Notice that we are not running GetFlowsHandle here. It is very
	// NOTE: important to pass c.Channels() inside, as it used to request and
	// NOTE: obtain connections (initially + after reconnections).
	getFlowsHandle, err := flow_stream.New(
		c.log.With(slog.String("component", "FlowStream")),
		c.ConnectionPool(),
		c.callPropsProvider,
	)

	if err != nil {
		c.log.Error("Failed to build FlowStream handle, panic", "error", err)
		panic(err.Error())
	}

	return getFlowsHandle
}

func (c *GRPCHubbleClient) ServerStatus(
	ctx context.Context,
) (*observer.ServerStatusResponse, error) {
	conn, err := c.GetStableConnection(ctx)
	if err != nil {
		return nil, err
	}

	obClient := observer.NewObserverClient(conn)
	return obClient.ServerStatus(ctx, &observer.ServerStatusRequest{}, c.callPropsProvider.CallOptions(ctx)...)
}

func (c *GRPCHubbleClient) HubbleNodes(
	ctx context.Context,
) (*observer.GetNodesResponse, error) {
	conn, err := c.GetStableConnection(ctx)
	if err != nil {
		return nil, err
	}

	obClient := observer.NewObserverClient(conn)
	return obClient.GetNodes(ctx, &observer.GetNodesRequest{}, c.callPropsProvider.CallOptions(ctx)...)
}

type StatusCheckerOptions struct {
	Delay time.Duration
	Log   *slog.Logger
}

func (c *GRPCHubbleClient) ServerStatusChecker(opts StatusCheckerOptions) (
	statuschecker.ServerStatusCheckerInterface, error,
) {
	statusChecker, err := statuschecker.New(
		opts.Log.With(slog.String("component", "StatusChecker")),
		opts.Delay,
		c.ConnectionPool(),
		c.callPropsProvider,
	)

	if err != nil {
		return nil, err
	}

	return statusChecker, nil
}
