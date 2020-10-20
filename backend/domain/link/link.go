package link

import (
	"fmt"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

type Link struct {
	Id              string
	SourceId        string
	DestinationId   string
	DestinationPort uint32

	// TODO: this is bad; create domain types for this fields
	Verdict    pbFlow.Verdict
	IPProtocol ui.IPProtocol

	ref *pbFlow.Flow
}

func FromFlowProto(f *pbFlow.Flow) *Link {
	if f.L4 == nil || f.Source == nil || f.Destination == nil {
		return nil
	}

	srcId, destId := service.IdsFromFlowProto(f)
	destPort, ipProtocol := portProtocolFromFlow(f)
	linkId := linkIdFromParts(srcId, destId, destPort, ipProtocol)

	return &Link{
		Id:              linkId,
		SourceId:        srcId,
		DestinationId:   destId,
		DestinationPort: destPort,
		Verdict:         f.Verdict,
		IPProtocol:      ipProtocol,

		ref: f,
	}
}

func portProtocolFromFlow(f *pbFlow.Flow) (uint32, ui.IPProtocol) {
	destPort := uint32(0)
	ipProtocol := ui.IPProtocol_UNKNOWN_IP_PROTOCOL

	if tcp := f.L4.GetTCP(); tcp != nil {
		destPort = tcp.DestinationPort
		ipProtocol = ui.IPProtocol_TCP
	}

	if udp := f.L4.GetUDP(); udp != nil {
		destPort = udp.DestinationPort
		ipProtocol = ui.IPProtocol_UDP
	}

	if icmp4 := f.L4.GetICMPv4(); icmp4 != nil {
		ipProtocol = ui.IPProtocol_ICMP_V4
	}

	if icmp6 := f.L4.GetICMPv6(); icmp6 != nil {
		ipProtocol = ui.IPProtocol_ICMP_V6
	}

	return destPort, ipProtocol
}

func linkIdFromParts(srcId, dstId string, port uint32, proto ui.IPProtocol) string {
	protocolStr := ui.IPProtocol_name[int32(proto)]
	linkId := fmt.Sprintf(
		"%v %v %v:%v",
		srcId,
		protocolStr,
		dstId,
		port,
	)

	return linkId
}

func (l *Link) String() string {
	return fmt.Sprintf(
		"<Link %p, %s '%v' (ns: '%s') -> '%v':%v (ns: '%s') (%v), from flow %p>",
		l,
		ui.IPProtocol_name[int32(l.IPProtocol)],
		l.SourceId,
		l.ref.Source.Namespace,
		l.DestinationId,
		l.DestinationPort,
		l.ref.Destination.Namespace,
		pbFlow.Verdict_name[int32(l.Verdict)],
		l.ref,
	)
}

func (l *Link) ToProto() *ui.ServiceLink {
	return &ui.ServiceLink{
		Id:              l.Id,
		SourceId:        l.SourceId,
		DestinationId:   l.DestinationId,
		DestinationPort: l.DestinationPort,
		Verdict:         l.Verdict,
		IpProtocol:      l.IPProtocol,
	}
}

func (l *Link) Equals(rhs *Link) bool {
	// NOTE: Id field is not participated here
	return (l.SourceId == rhs.SourceId &&
		l.DestinationId == rhs.DestinationId &&
		l.DestinationPort == rhs.DestinationPort &&
		l.Verdict == rhs.Verdict &&
		l.IPProtocol == rhs.IPProtocol)
}

func (l *Link) IntoFlow() *pbFlow.Flow {
	return l.ref
}
