package common

import (
	"github.com/cilium/hubble-ui/backend/domain/events"
	"github.com/cilium/hubble-ui/backend/domain/namespaces"
	v1 "k8s.io/api/core/v1"
)

type NSEvent struct {
	Event        events.EventKind
	K8sNamespace *v1.Namespace
}

func (nse *NSEvent) IntoDescriptor() *namespaces.Descriptor {
	return namespaces.NewDescriptor(nse.K8sNamespace)
}

func (nse *NSEvent) GetNamespaceStr() string {
	if nse.K8sNamespace != nil {
		return nse.K8sNamespace.Name
	}

	return ""
}

func EventFromNSObject(event events.EventKind, obj interface{}) *NSEvent {
	ns := obj.(*v1.Namespace)

	return &NSEvent{
		Event:        event,
		K8sNamespace: ns,
	}
}
