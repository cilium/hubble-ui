package namespaces

import (
	"time"

	"github.com/cilium/hubble-ui/backend/proto/ui"
	"google.golang.org/protobuf/types/known/timestamppb"
	v1 "k8s.io/api/core/v1"
)

type Descriptor struct {
	Id           *string
	Name         string
	CreationTime *time.Time
}

func NewDescriptorFromProto(desc *ui.NamespaceDescriptor) *Descriptor {
	nd := new(Descriptor)
	nd.Name = desc.GetName()

	t := desc.GetCreationTimestamp().AsTime()
	nd.CreationTime = &t

	if desc.GetId() != "" {
		nd.Id = &desc.Id
	}

	return nd
}

func NewDescriptor(ns *v1.Namespace) *Descriptor {
	name := ""
	if ns != nil {
		name = ns.Name
	}

	var id *string = nil
	if ns != nil {
		id = (*string)(&ns.UID)
	}

	creationTime := time.Now()
	if ns != nil {
		creationTime = ns.CreationTimestamp.Time
	}

	return &Descriptor{
		Id:           id,
		Name:         name,
		CreationTime: &creationTime,
	}
}

func NewDescriptorFromK8sObject(ns *v1.Namespace) *Descriptor {
	return &Descriptor{
		Id:           (*string)(&ns.UID),
		Name:         ns.Name,
		CreationTime: &ns.CreationTimestamp.Time,
	}
}

func (nd *Descriptor) IntoProto() *ui.NamespaceDescriptor {
	desc := new(ui.NamespaceDescriptor)
	desc.Name = nd.Name

	if nd.Id != nil {
		desc.Id = *nd.Id
	}

	if nd.CreationTime != nil {
		desc.CreationTimestamp = timestamppb.New(*nd.CreationTime)
	}

	return desc
}
