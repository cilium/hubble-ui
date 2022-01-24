package common

import (
	"github.com/cilium/hubble-ui/backend/internal/types"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"google.golang.org/protobuf/types/known/timestamppb"
	v1 "k8s.io/api/core/v1"
)

type NSEvent struct {
	Event        types.EventKind
	K8sNamespace *v1.Namespace
}

func (nse *NSEvent) GetNamespaceStr() string {
	return nse.K8sNamespace.Name
}

func (nse *NSEvent) IntoK8sNamespaceProto() *ui.K8SNamespace {
	createdAt := nse.K8sNamespace.CreationTimestamp

	return &ui.K8SNamespace{
		Id:                string(nse.K8sNamespace.GetUID()),
		Name:              nse.GetNamespaceStr(),
		CreationTimestamp: timestamppb.New(createdAt.Time),
	}
}

func EventFromNSObject(event types.EventKind, obj interface{}) *NSEvent {
	ns, ok := obj.(*v1.Namespace)
	if !ok {
		return nil
	}

	return &NSEvent{
		Event:        event,
		K8sNamespace: ns,
	}
}
