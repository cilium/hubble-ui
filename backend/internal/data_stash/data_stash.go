package data_stash

import (
	ns_common "github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
)

// NOTE: Consider include into this struct all the fields of entities that
// should be accumulated
type DataStash struct {
	namespaceEvents map[string]*ns_common.NSEvent
}

func New() *DataStash {
	return &DataStash{
		namespaceEvents: make(map[string]*ns_common.NSEvent),
	}
}

func (ds *DataStash) PushNamespaceEvent(ns *ns_common.NSEvent) *ns_common.NSEvent {
	nsKey := ns.GetNamespaceStr()
	existing, exists := ds.namespaceEvents[nsKey]

	if !exists {
		ds.namespaceEvents[nsKey] = ns
		return ns
	}

	if ns.K8sNamespace != nil {
		existing.K8sNamespace = ns.K8sNamespace
	}

	return existing
}

func (ds *DataStash) FlushNamespaces() []*ns_common.NSEvent {
	nss := make([]*ns_common.NSEvent, 0, len(ds.namespaceEvents))

	for _, ns := range ds.namespaceEvents {
		nss = append(nss, ns)
	}

	clear(ds.namespaceEvents)
	return nss
}
