package server

import (
	"fmt"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

type serviceCache struct {
	services map[string]*ui.Service
	links    map[string]*ui.ServiceLink
}

func newServiceCache() *serviceCache {
	return &serviceCache{
		services: make(map[string]*ui.Service),
		links:    make(map[string]*ui.ServiceLink),
	}
}

func (c *serviceCache) Drop() {
	c.services = make(map[string]*ui.Service)
	c.links = make(map[string]*ui.ServiceLink)
}

func (c *serviceCache) FromFlow(pbf *pbFlow.Flow) (
	*ui.GetEventsResponse, *ui.GetEventsResponse,
) {
	var senderEvent, receiverEvent *ui.GetEventsResponse

	f := flow.FromProto(pbf)
	senderSvc, receiverSvc := f.BuildServices()
	senderProto, receiverProto := senderSvc.ToProto(), receiverSvc.ToProto()

	// TODO: check if updated data received from flow
	_, exists := c.services[senderProto.Id]
	if !exists {
		c.services[senderProto.Id] = senderProto
		senderEvent = eventResponseFromService(pbf, senderProto)
	}

	// TODO: check if updated data received from flow
	_, exists = c.services[receiverProto.Id]
	if !exists {
		c.services[receiverProto.Id] = receiverProto
		receiverEvent = eventResponseFromService(pbf, receiverProto)
	}

	return senderEvent, receiverEvent
}

func (c *serviceCache) LinkFromFlow(f *pbFlow.Flow) *ui.GetEventsResponse {
	if f.L4 == nil || f.Source == nil || f.Destination == nil {
		return nil
	}

	srcId, destId := service.IdsFromFlowProto(f)
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

	protocolStr := ui.IPProtocol_name[int32(ipProtocol)]
	linkId := fmt.Sprintf("%v %v %v:%v", srcId, protocolStr, destId, destPort)

	// TODO: check if cached data should be updated and resend to client
	_, ok := c.links[linkId]
	if ok {
		return nil
	}

	slink := &ui.ServiceLink{
		Id:              linkId,
		SourceId:        fmt.Sprintf("%v", srcId),
		DestinationId:   fmt.Sprintf("%v", destId),
		DestinationPort: destPort,
		Verdict:         f.Verdict,
		IpProtocol:      ipProtocol,
	}

	c.links[linkId] = slink

	lstate := &ui.ServiceLinkState{
		ServiceLink: slink,
		Type:        ui.StateChange_EXISTS,
	}

	return &ui.GetEventsResponse{
		Node:      f.NodeName,
		Timestamp: f.Time,
		Event:     &ui.GetEventsResponse_ServiceLinkState{lstate},
	}
}

func eventResponseFromService(
	f *pbFlow.Flow, svc *ui.Service,
) *ui.GetEventsResponse {
	sstate := &ui.ServiceState{
		Service: svc,
		Type:    ui.StateChange_EXISTS,
	}

	return &ui.GetEventsResponse{
		Node:      f.NodeName,
		Timestamp: f.Time,
		Event:     &ui.GetEventsResponse_ServiceState{sstate},
	}
}
