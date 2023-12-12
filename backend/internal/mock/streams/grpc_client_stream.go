package streams

import (
	"context"

	"github.com/sirupsen/logrus"
	"google.golang.org/grpc/metadata"
)

type GRPCClientStream struct {
	ctx context.Context
	log logrus.FieldLogger
}

func NewGRPCClientStream(ctx context.Context, log logrus.FieldLogger) *GRPCClientStream {
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
	s.log.WithField("msg", m).Info("SendMsg")
	return nil
}

func (s *GRPCClientStream) RecvMsg(m any) error {
	s.log.WithField("msg", m).Info("RecvMsg")
	return nil
}
