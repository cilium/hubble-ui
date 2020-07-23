package server

import (
	"fmt"
	"strings"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"github.com/golang/protobuf/ptypes"
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

func (c *serviceCache) FromFlow(f *flow.Flow) (
	*ui.GetEventsResponse, *ui.GetEventsResponse,
) {
	var senderEvent, receiverEvent *ui.GetEventsResponse

	senderSvc := serviceFromEndpoint(f.Source, f.SourceNames)
	receiverSvc := serviceFromEndpoint(f.Destination, f.DestinationNames)

	// TODO: check if updated data received from flow
	_, exists := c.services[senderSvc.Id]
	if !exists {
		senderEvent = eventResponseFromService(f, senderSvc)
		c.services[senderSvc.Id] = senderSvc
	}

	// TODO: check if updated data received from flow
	_, exists = c.services[receiverSvc.Id]
	if !exists {
		receiverEvent = eventResponseFromService(f, receiverSvc)
		c.services[receiverSvc.Id] = receiverSvc
	}

	return senderEvent, receiverEvent
}

func (c *serviceCache) LinkFromFlow(f *flow.Flow) *ui.GetEventsResponse {
	if f.L4 == nil || f.Source == nil || f.Destination == nil {
		return nil
	}

	srcId := getServiceId(f.Source, f.SourceNames)
	destId := getServiceId(f.Destination, f.DestinationNames)
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
	f *flow.Flow, svc *ui.Service,
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

func serviceFromEndpoint(ep *flow.Endpoint, dnsNames []string) *ui.Service {
	serviceId := getServiceId(ep, dnsNames)

	return &ui.Service{
		Id:                     serviceId,
		Name:                   appNameFromLabels(ep.Labels, serviceId),
		Namespace:              ep.Namespace,
		Labels:                 ep.Labels,
		DnsNames:               dnsNames,
		EgressPolicyEnforced:   false,
		IngressPolicyEnforced:  false,
		VisibilityPolicyStatus: "",
		CreationTimestamp:      ptypes.TimestampNow(),
	}
}

func appNameFromLabels(labels []string, identity string) string {
	for _, lbl := range labels {
		one := strings.HasPrefix(lbl, "k8s:k8s-app")
		two := strings.HasPrefix(lbl, "k8s-app")

		if !(one || two) {
			continue
		}

		parts := strings.SplitN(lbl, "=", 2)
		if len(parts) != 2 {
			continue
		}

		return parts[1]
	}

	// Fallback app name based on identity
	return fmt.Sprintf("identity-%v", identity)
}

func getServiceId(ep *flow.Endpoint, dnsNames []string) string {
	if isWorld(ep.Labels) && len(dnsNames) > 0 {
		return dnsNames[0]
	}

	return fmt.Sprintf("%v", ep.Identity)
}

func isWorld(labels []string) bool {
	for _, lbl := range labels {
		if strings.Contains(lbl, "reserved:world") {
			return true
		}
	}

	return false
}
