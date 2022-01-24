package nswatcher

import (
	"errors"
	"sync"

	"github.com/sirupsen/logrus"
	"k8s.io/client-go/kubernetes"
)

type Builder struct {
	log *logrus.Entry
	k8s kubernetes.Interface
}

func New() Builder {
	return Builder{}
}

func (b Builder) WithLogger(log *logrus.Entry) Builder {
	b.log = log
	return b
}

func (b Builder) WithKubernetes(k8s kubernetes.Interface) Builder {
	b.k8s = k8s
	return b
}

func (b Builder) Unwrap() (*Watcher, error) {
	if b.log == nil {
		return nil, errors.New("cannot build Watcher: no logger set")
	}

	if b.k8s == nil {
		return nil, errors.New("cannot build Watcher: no k8s interface set")
	}

	w := new(Watcher)
	w.log = b.log
	w.stop = make(chan struct{})
	w.stopOnce = sync.Once{}
	w.k8s = b.k8s

	return w, nil
}
