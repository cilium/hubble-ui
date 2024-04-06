package sources

import (
	"context"

	ns_common "github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
)

type NamespaceSource struct {
	emptySource

	initial []*ns_common.NSEvent
	events  NSEventChannel
}

func Namespaces(initial []*ns_common.NSEvent) *NamespaceSource {
	return &NamespaceSource{
		emptySource: newEmpty(),
		initial:     dup(initial),
		events:      make(NSEventChannel),
	}
}

func (nss *NamespaceSource) Run(ctx context.Context) {
	for _, evt := range nss.initial {
		select {
		case <-ctx.Done():
			return
		case <-nss.Stopped():
			return
		case nss.events <- evt:
		}
	}
}

func (nss *NamespaceSource) Duplicate() MockedSource {
	return Namespaces(nss.initial)
}

func (nss *NamespaceSource) Namespaces() NSEventChannel {
	return nss.events
}

func dup[T any](s []T) []T {
	d := make([]T, len(s))

	copy(d, s)
	return d
}
