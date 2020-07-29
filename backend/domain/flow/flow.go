package flow

import (
	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/service"
)

type Flow struct {
	ref *pbFlow.Flow
}

func FromProto(f *pbFlow.Flow) *Flow {
	return &Flow{f}
}

func (f *Flow) BuildServices() (*service.Service, *service.Service) {
	sender := f.BuildSenderService()
	receiver := f.BuildReceiverService()

	return sender, receiver
}

func (f *Flow) BuildSenderService() *service.Service {
	svc := service.FromEndpointProtoAndDns(f.ref.Source, f.ref.SourceNames)
	svc.SetIsSender(true)

	return svc
}

func (f *Flow) BuildReceiverService() *service.Service {
	svc := service.FromEndpointProtoAndDns(f.ref.Source, f.ref.SourceNames)
	svc.SetIsReceiver(true)

	return svc
}
