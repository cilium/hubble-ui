package statuschecker

import (
	"errors"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

type builder struct {
	log         *logrus.Entry
	newClientFn NewClientFn
	delay       *time.Duration
}

func (b builder) WithLogger(log *logrus.Entry) builder {
	b.log = log
	return b
}

func (b builder) WithNewClientFunction(fn NewClientFn) builder {
	b.newClientFn = fn
	return b
}

func (b builder) WithDelay(delay time.Duration) builder {
	b.delay = &delay
	return b
}

func (b builder) Unwrap() (*Handle, error) {
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
