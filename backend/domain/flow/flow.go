package flow

import (
	"fmt"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/service"
)

type Flow struct {
	ref *pbFlow.Flow
}

func FromProto(f *pbFlow.Flow) *Flow {
	return &Flow{f}
}

func Wrap(many []*pbFlow.Flow) []*Flow {
	w := make([]*Flow, len(many))

	for i, pbf := range many {
		w[i] = FromProto(pbf)
	}

	return w
}

func Unwrap(many []*Flow) []*pbFlow.Flow {
	u := make([]*pbFlow.Flow, len(many))

	for i, f := range many {
		u[i] = f.Ref()
	}

	return u
}

func (f *Flow) BuildServices() (*service.Service, *service.Service) {
	sender := f.BuildSenderService()
	receiver := f.BuildReceiverService()

	return sender, receiver
}

func (f *Flow) BuildSenderService() *service.Service {
	svc := service.FromEndpointProtoAndDNS(
		f.ref, f.ref.Source, f.ref.SourceNames,
	)

	svc.SetIsSender(true)

	return svc
}

func (f *Flow) BuildReceiverService() *service.Service {
	svc := service.FromEndpointProtoAndDNS(
		f.ref, f.ref.Destination, f.ref.DestinationNames,
	)

	svc.SetIsReceiver(true)

	return svc
}

func (f *Flow) TCP() *pbFlow.TCP {
	if f.ref.L4 == nil {
		return nil
	}

	tcp, ok := f.ref.L4.Protocol.(*pbFlow.Layer4_TCP)
	if !ok {
		return nil
	}

	return tcp.TCP
}

func (f *Flow) UDP() *pbFlow.UDP {
	if f.ref.L4 == nil {
		return nil
	}

	udp, ok := f.ref.L4.Protocol.(*pbFlow.Layer4_UDP)
	if !ok {
		return nil
	}

	return udp.UDP
}

func (f *Flow) ICMPv4() *pbFlow.Layer4_ICMPv4 {
	if f.ref.L4 == nil {
		return nil
	}

	icmp, ok := f.ref.L4.Protocol.(*pbFlow.Layer4_ICMPv4)
	if !ok {
		return nil
	}

	return icmp
}

func (f *Flow) ICMPv6() *pbFlow.Layer4_ICMPv6 {
	if f.ref.L4 == nil {
		return nil
	}

	icmp, ok := f.ref.L4.Protocol.(*pbFlow.Layer4_ICMPv6)
	if !ok {
		return nil
	}

	return icmp
}

func (f *Flow) ProtocolString() string {
	switch {
	case f.TCP() != nil:
		return "TCP"
	case f.UDP() != nil:
		return "UDP"
	case f.ICMPv4() != nil:
		return "ICMPv4"
	case f.ICMPv6() != nil:
		return "ICMPv6"
	default:
		return "Unknown"
	}
}

func (f *Flow) DestinationPort() *uint32 {
	if tcp := f.TCP(); tcp != nil {
		return &tcp.DestinationPort
	}

	if udp := f.UDP(); udp != nil {
		return &udp.DestinationPort
	}

	return nil
}

func (f *Flow) SourcePort() *uint32 {
	if tcp := f.TCP(); tcp != nil {
		return &tcp.SourcePort
	}

	if udp := f.UDP(); udp != nil {
		return &udp.SourcePort
	}

	return nil
}

func (f *Flow) String() string {
	srcPort, dstPort := "-", "-"
	if f.SourcePort() != nil {
		srcPort = fmt.Sprintf("%d", *f.SourcePort())
	}

	if f.DestinationPort() != nil {
		dstPort = fmt.Sprintf("%d", *f.DestinationPort())
	}

	sourceEpDesc := "nil"
	if f.ref.Source != nil {
		sourceEpDesc = fmt.Sprintf(
			"ID: %d, Identity: %d, ns: %s, podname: %s, labels: %v",
			f.ref.Source.ID,
			f.ref.Source.Identity,
			f.ref.Source.Namespace,
			f.ref.Source.PodName,
			f.ref.Source.Labels,
		)
	}

	sourceSvc := f.ref.SourceService
	sourceSvcDesc := "nil"
	if sourceSvc != nil {
		sourceSvcDesc = fmt.Sprintf(
			"ns: %s, name: %s",
			sourceSvc.Namespace,
			sourceSvc.Name,
		)
	}

	destinationEp := f.ref.Destination
	destinationEpDesc := "nil"
	if destinationEp != nil {
		destinationEpDesc = fmt.Sprintf(
			"ID: %d, Identity: %d, ns: %s, podname: %s, labels: %v",
			destinationEp.ID,
			destinationEp.Identity,
			destinationEp.Namespace,
			destinationEp.PodName,
			destinationEp.Labels,
		)
	}

	destinationSvc := f.ref.DestinationService
	destinationSvcDesc := "nil"
	if destinationSvc != nil {
		destinationSvcDesc = fmt.Sprintf(
			"ns: %s, name: %s",
			destinationSvc.Namespace,
			destinationSvc.Name,
		)
	}

	return fmt.Sprintf(
		"<Flow %p, protocol: %s, "+
			"Source endpoint: %s, "+
			"Source service: %s, "+
			"Source names: %v, "+
			"Source port: %v, "+
			"Destination endpoint: %s, "+
			"Destination service: %s, "+
			"Destination names: %v, "+
			"Destination port: %v>",
		f,
		f.ProtocolString(),
		sourceEpDesc,
		sourceSvcDesc,
		f.ref.SourceNames,
		srcPort,
		destinationEpDesc,
		destinationSvcDesc,
		f.ref.DestinationNames,
		dstPort,
	)
}

func (f *Flow) Ref() *pbFlow.Flow {
	return f.ref
}
