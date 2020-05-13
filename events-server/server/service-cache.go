package server

import (
	"fmt"
	"strings"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/cilium/api/v1/relay"
	"github.com/golang/protobuf/ptypes"
)

type serviceCache struct {
	services map[string]*relay.RelayService
	links    map[string]*relay.ServiceLink
}

func newServiceCache() *serviceCache {
	return &serviceCache{
		services: make(map[string]*relay.RelayService),
		links:    make(map[string]*relay.ServiceLink),
	}
}

func (c *serviceCache) FromFlow(f *flow.Flow) (
	*relay.GetEventsResponse, *relay.GetEventsResponse,
) {
	var senderEvent, receiverEvent *relay.GetEventsResponse

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

func (c *serviceCache) LinkFromFlow(f *flow.Flow) *relay.GetEventsResponse {
	if f.L4 == nil || f.Source == nil || f.Destination == nil {
		return nil
	}

	srcId := f.Source.Identity
	destId := f.Destination.Identity
	destPort := uint32(0)
	ipProtocol := relay.IPProtocol_UNKNOWN_IP_PROTOCOL

	if tcp := f.L4.GetTCP(); tcp != nil {
		destPort = tcp.DestinationPort
		ipProtocol = relay.IPProtocol_TCP
	}

	if udp := f.L4.GetUDP(); udp != nil {
		destPort = udp.DestinationPort
		ipProtocol = relay.IPProtocol_UDP
	}

	if icmp4 := f.L4.GetICMPv4(); icmp4 != nil {
		ipProtocol = relay.IPProtocol_ICMP_V4
	}

	if icmp6 := f.L4.GetICMPv6(); icmp6 != nil {
		ipProtocol = relay.IPProtocol_ICMP_V6
	}

	protocolStr := relay.IPProtocol_name[int32(ipProtocol)]
	linkId := fmt.Sprintf("%v %v %v:%v", srcId, protocolStr, destId, destPort)

	// TODO: check if cached data should be updated and resend to client
	_, ok := c.links[linkId]
	if ok {
		return nil
	}

	slink := &relay.ServiceLink{
		Id:              linkId,
		SourceId:        fmt.Sprintf("%v", srcId),
		DestinationId:   fmt.Sprintf("%v", destId),
		DestinationPort: destPort,
		Verdict:         f.Verdict,
		IpProtocol:      ipProtocol,
	}

	c.links[linkId] = slink

	lstate := &relay.ServiceLinkState{
		ServiceLink: slink,
		Type:        relay.StateChange_EXISTS,
	}

	return &relay.GetEventsResponse{
		Node:      f.NodeName,
		Timestamp: f.Time,
		Event:     &relay.GetEventsResponse_ServiceLinkState{lstate},
	}
}

func eventResponseFromService(
	f *flow.Flow, svc *relay.RelayService,
) *relay.GetEventsResponse {
	sstate := &relay.ServiceState{
		Service: svc,
		Type:    relay.StateChange_EXISTS,
	}

	return &relay.GetEventsResponse{
		Node:      f.NodeName,
		Timestamp: f.Time,
		Event:     &relay.GetEventsResponse_ServiceState{sstate},
	}
}

func serviceFromEndpoint(ep *flow.Endpoint, dnsNames []string) *relay.RelayService {
	return &relay.RelayService{
		Id:                     fmt.Sprintf("%v", ep.Identity),
		Name:                   appNameFromLabels(ep.Labels, ep.Identity),
		Namespace:              ep.Namespace,
		Labels:                 ep.Labels,
		DnsNames:               dnsNames,
		EgressPolicyEnforced:   false,
		IngressPolicyEnforced:  false,
		VisibilityPolicyStatus: "",
		CreationTimestamp:      ptypes.TimestampNow(),
	}
}

func appNameFromLabels(labels []string, identity uint32) string {
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
