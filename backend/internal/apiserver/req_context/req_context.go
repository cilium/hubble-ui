package req_context

import (
	"context"
	"log/slog"
	"sync"
)

type Context struct {
	Log *slog.Logger

	mx  sync.Mutex
	ctx context.Context
}

func New(ctx context.Context) *Context {
	return &Context{
		Log: nil,
		ctx: ctx,
		mx:  sync.Mutex{},
	}
}

func (c *Context) Context() context.Context {
	return c.ctx
}

func (c *Context) SetLogger(log *slog.Logger) *Context {
	c.Log = log
	return c
}
