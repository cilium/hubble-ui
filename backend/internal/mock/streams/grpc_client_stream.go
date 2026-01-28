package streams

import (
	"context"
	"log/slog"

	"google.golang.org/grpc/metadata"
)

type GRPCClientStream struct {
	ctx context.Context
	log *slog.Logger
}

func NewGRPCClientStream(ctx context.Context, log *slog.Logger) *GRPCClientStream {
	return &GRPCClientStream{
		ctx: ctx,
		log: log,
	}
}

func (s *GRPCClientStream) Header() (metadata.MD, error) {
	return make(metadata.MD), nil
}

func (s *GRPCClientStream) Trailer() metadata.MD {
	return make(metadata.MD)
}

func (s *GRPCClientStream) CloseSend() error {
	return nil
}

func (s *GRPCClientStream) Context() context.Context {
	return s.ctx
}

func (s *GRPCClientStream) SendMsg(m any) error {
	s.log.Info("SendMsg", "msg", m)
	return nil
}

func (s *GRPCClientStream) RecvMsg(m any) error {
	s.log.Info("RecvMsg", "msg", m)
	return nil
}
