package req_context

import (
	"context"
	"sync"

	"github.com/sirupsen/logrus"
)

type Context struct {
	Log logrus.FieldLogger

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

func (c *Context) SetLogger(log logrus.FieldLogger) *Context {
	c.Log = log
	return c
}
