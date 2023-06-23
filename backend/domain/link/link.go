package link

import (
	"fmt"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

type Link struct {
	ID              string
	SourceID        string
	DestinationID   string
	DestinationPort uint32

	// TODO: this is bad; create domain types for this fields
	Verdict     pbFlow.Verdict
	IPProtocol  ui.IPProtocol
	AuthType    pbFlow.AuthType
	IsEncrypted bool

	ref *pbFlow.Flow
}

func FromFlowProto(f *pbFlow.Flow) *Link {
	if f.L4 == nil || f.Source == nil || f.Destination == nil {
		return nil
	}

	srcID, destID := service.IDsFromFlowProto(f)
	destPort, ipProtocol := portProtocolFromFlow(f)
	linkID := linkIDFromParts(srcID, destID, destPort, ipProtocol)

	IsEncrypted := false
	if f.IP != nil && f.IP.GetEncrypted() {
		IsEncrypted = true
	}

	return &Link{
		ID:              linkID,
		SourceID:        srcID,
		DestinationID:   destID,
		DestinationPort: destPort,
		Verdict:         f.Verdict,
		AuthType:        f.AuthType,
		IPProtocol:      ipProtocol,
		IsEncrypted:     IsEncrypted,

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

func linkIDFromParts(srcID, dstID string, port uint32, proto ui.IPProtocol) string {
	protocolStr := ui.IPProtocol_name[int32(proto)]
	return fmt.Sprintf(
		"%v %v %v:%v",
		srcID,
		protocolStr,
		dstID,
		port,
	)
}

func (l *Link) String() string {
	return fmt.Sprintf(
		"<Link %p, %s '%v' (ns: '%s') -> '%v':%v (ns: '%s') (%v), from flow %p>",
		l,
		ui.IPProtocol_name[int32(l.IPProtocol)],
		l.SourceID,
		l.ref.Source.Namespace,
		l.DestinationID,
		l.DestinationPort,
		l.ref.Destination.Namespace,
		pbFlow.Verdict_name[int32(l.Verdict)],
		l.ref,
	)
}

func (l *Link) ToProto() *ui.ServiceLink {
	return &ui.ServiceLink{
		Id:              l.ID,
		SourceId:        l.SourceID,
		DestinationId:   l.DestinationID,
		DestinationPort: l.DestinationPort,
		Verdict:         l.Verdict,
		IpProtocol:      l.IPProtocol,
		AuthType:        l.AuthType,
	}
}

func (l *Link) Equals(rhs *Link) bool {
	// NOTE: Id field is not participated here
	return (l.SourceID == rhs.SourceID &&
		l.DestinationID == rhs.DestinationID &&
		l.DestinationPort == rhs.DestinationPort &&
		l.Verdict == rhs.Verdict &&
		l.IPProtocol == rhs.IPProtocol &&
		l.AuthType == rhs.AuthType &&
		l.IsEncrypted == rhs.IsEncrypted)
}

func (l *Link) IntoFlow() *pbFlow.Flow {
	return l.ref
}
