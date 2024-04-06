package link

import (
	"fmt"
	"strconv"
	"strings"

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
	Verdict     pbFlow.Verdict
	IPProtocol  ui.IPProtocol
	AuthType    pbFlow.AuthType
	IsEncrypted bool

	FlowAmount      uint64
	LatenciesNs     []uint64
	BytesTransfered uint64

	ref *pbFlow.Flow
}

func FromFlowProto(f *pbFlow.Flow) *Link {
	if f.GetL4() == nil || f.GetSource() == nil || f.GetDestination() == nil {
		return nil
	}

	srcId, destId := service.IdsFromFlowProto(f)
	destPort, ipProtocol := portProtocolFromFlow(f)
	linkId := linkIdFromParts(srcId, destId, destPort, ipProtocol)

	latencies := []uint64{}
	flowLatency := getFlowLatency(f)
	if flowLatency > 0 {
		latencies = append(latencies, flowLatency)
	}

	bytesTransfered := GetFlowBytesTransfered(f)
	isEncrypted := f.GetIP().GetEncrypted()

	return &Link{
		Id:              linkId,
		SourceId:        srcId,
		DestinationId:   destId,
		DestinationPort: destPort,
		Verdict:         f.GetVerdict(),
		AuthType:        f.GetAuthType(),
		IPProtocol:      ipProtocol,

		FlowAmount:      1,
		LatenciesNs:     latencies,
		BytesTransfered: bytesTransfered,
		IsEncrypted:     isEncrypted,

		ref: f,
	}
}

func getFlowLatency(f *pbFlow.Flow) uint64 {
	l7 := f.GetL7()
	if l7 == nil {
		return 0
	}

	return l7.GetLatencyNs()
}

func GetFlowBytesTransfered(f *pbFlow.Flow) uint64 {
	l7 := f.GetL7()
	if l7 == nil {
		return 0
	}

	http := l7.GetHttp()
	if http == nil {
		return 0
	}

	for _, h := range http.GetHeaders() {
		if strings.ToLower(h.GetKey()) != "content-length" {
			continue
		}

		num, err := strconv.ParseUint(h.GetValue(), 10, 64)
		if err != nil {
			break
		}

		return num
	}

	return 0
}

func portProtocolFromFlow(f *pbFlow.Flow) (uint32, ui.IPProtocol) {
	destPort := uint32(0)
	ipProtocol := ui.IPProtocol_UNKNOWN_IP_PROTOCOL

	if tcp := f.GetL4().GetTCP(); tcp != nil {
		destPort = tcp.GetDestinationPort()
		ipProtocol = ui.IPProtocol_TCP
	}

	if udp := f.GetL4().GetUDP(); udp != nil {
		destPort = udp.GetDestinationPort()
		ipProtocol = ui.IPProtocol_UDP
	}

	if icmp4 := f.GetL4().GetICMPv4(); icmp4 != nil {
		ipProtocol = ui.IPProtocol_ICMP_V4
	}

	if icmp6 := f.GetL4().GetICMPv6(); icmp6 != nil {
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
		l.ref.GetSource().GetNamespace(),
		l.DestinationId,
		l.DestinationPort,
		l.ref.GetDestination().GetNamespace(),
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
		AuthType:        l.AuthType,
		IsEncrypted:     l.IsEncrypted,
	}
}

func (l *Link) Equals(rhs *Link) bool {
	// NOTE: Id field is not participated here
	return (l.SourceId == rhs.SourceId &&
		l.DestinationId == rhs.DestinationId &&
		l.DestinationPort == rhs.DestinationPort &&
		l.Verdict == rhs.Verdict &&
		l.IPProtocol == rhs.IPProtocol &&
		l.AuthType == rhs.AuthType &&
		l.IsEncrypted == rhs.IsEncrypted)
}

func (l *Link) AccumulateFlow(f *pbFlow.Flow) {
	l.FlowAmount += 1
	l.BytesTransfered += GetFlowBytesTransfered(f)
	l.LatenciesNs = append(l.LatenciesNs, getFlowLatency(f))
}

func (l *Link) AccumulateLink(rhs *Link) *Link {
	l.BytesTransfered += rhs.BytesTransfered
	l.FlowAmount += rhs.FlowAmount

	return l
}

func (l *Link) DropStats() *Link {
	l.BytesTransfered = 0
	l.LatenciesNs = []uint64{}

	return l
}

func (l *Link) IntoFlow() *pbFlow.Flow {
	return l.ref
}
