package statuschecker

import (
	"errors"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

type Builder struct {
	log         *logrus.Entry
	newClientFn NewClientFn
	delay       *time.Duration
}

func (b Builder) WithLogger(log *logrus.Entry) Builder {
	b.log = log
	return b
}

func (b Builder) WithNewClientFunction(fn NewClientFn) Builder {
	b.newClientFn = fn
	return b
}

func (b Builder) WithDelay(delay time.Duration) Builder {
	b.delay = &delay
	return b
}

func (b Builder) Unwrap() (*Handle, error) {
	if b.log == nil {
		return nil, errors.New("cannot build status_checker: no logger")
	}

	if b.newClientFn == nil {
		return nil, errors.New("cannot build status_checker: no client function")
	}

	h := new(Handle)
	h.log = b.log
	h.stop = make(chan struct{})
	h.stopOnce = sync.Once{}
	h.newClientFn = b.newClientFn

	if b.delay != nil {
		h.delay = *b.delay
	} else {
		h.delay = 3 * time.Second
	}

	return h, nil
}
