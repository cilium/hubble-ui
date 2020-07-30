package service

import (
	"fmt"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/labels"
	pbUi "github.com/cilium/hubble-ui/backend/proto/ui"

	"github.com/golang/protobuf/ptypes"
)

type Service struct {
	LabelProps *labels.LabelProps

	ref        *pbUi.Service
	endpoint   *pbFlow.Endpoint
	dnsNames   []string
	isSender   bool
	isReceiver bool
}

func FromEndpointProtoAndDns(ep *pbFlow.Endpoint, dnsNames []string) *Service {
	svc := new(Service)
	svc.endpoint = ep
	svc.dnsNames = dnsNames

	svc.LabelProps = labels.Props(ep.Labels)

	return svc
}

func IdsFromFlowProto(f *pbFlow.Flow) (string, string) {
	sourceProps := labels.Props(f.Source.Labels)
	destProps := labels.Props(f.Destination.Labels)

	senderSvcId := getServiceId(
		f.Source, f.SourceNames, sourceProps, false,
	)

	receiverSvcId := getServiceId(
		f.Destination, f.DestinationNames, destProps, true,
	)

	return senderSvcId, receiverSvcId
}

// TODO: its not ok to have this code here
func (s *Service) ToProto() *pbUi.Service {
	serviceId := s.Id()

	serviceName := fmt.Sprintf("%v", serviceId)
	if s.LabelProps.AppName != nil {
		serviceName = *s.LabelProps.AppName
	}

	return &pbUi.Service{
		Id:                     serviceId,
		Name:                   serviceName,
		Namespace:              s.endpoint.Namespace,
		Labels:                 s.endpoint.Labels,
		DnsNames:               s.dnsNames,
		EgressPolicyEnforced:   false,
		IngressPolicyEnforced:  false,
		VisibilityPolicyStatus: "",
		CreationTimestamp:      ptypes.TimestampNow(),
	}
}

func (s *Service) SetIsSender(state bool) {
	s.isSender = state
}

func (s *Service) SetIsReceiver(state bool) {
	s.isReceiver = state
}

func (s *Service) Id() string {
	return getServiceId(s.endpoint, s.dnsNames, s.LabelProps, s.isReceiver)
}

func getServiceId(
	ep *pbFlow.Endpoint,
	dnsNames []string,
	lblProps *labels.LabelProps,
	isWorldReceiver bool,
) string {
	if lblProps.IsWorld {
		sideStr := "sender"
		if isWorldReceiver {
			sideStr = "receiver"
		}

		if len(dnsNames) > 0 {
			return fmt.Sprintf("%s-%s", dnsNames[0], sideStr)
		}

		return fmt.Sprintf("world-%s", sideStr)
	}

	return fmt.Sprintf("%v", ep.Identity)
}
