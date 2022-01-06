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
	if f.TCP() != nil {
		return "TCP"
	} else if f.UDP() != nil {
		return "UDP"
	} else if f.ICMPv4() != nil {
		return "ICMPv4"
	} else if f.ICMPv6() != nil {
		return "ICMPv6"
	}

	return "Unknown"
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
		srcPort = fmt.Sprintf("%d", f.SourcePort())
	}

	if f.DestinationPort() != nil {
		dstPort = fmt.Sprintf("%d", f.DestinationPort())
	}

	return fmt.Sprintf(
		"<Flow %p, %s %s/%v (port: %v) -> %s/%v (port: %v)>",
		f,
		f.ProtocolString(),
		f.ref.Source.Namespace,
		f.ref.Source.Identity,
		srcPort,
		f.ref.Destination.Namespace,
		f.ref.Destination.Identity,
		dstPort,
	)
}

func (f *Flow) Ref() *pbFlow.Flow {
	return f.ref
}
