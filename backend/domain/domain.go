package domain

import (
	"fmt"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/domain/labels"
	"github.com/cilium/hubble-ui/backend/proto/ui"

	"github.com/golang/protobuf/ptypes"
)

type Side string

const (
	Source      Side = "source"
	Destination Side = "destination"
)

// TODO: its not ok that domain relies on protobuf, but ok for now though
func ServicesFromFlow(f *flow.Flow) (*ui.Service, *ui.Service) {
	senderSvc := serviceFromEndpoint(
		f.Source, f.SourceNames, Source,
	)

	receiverSvc := serviceFromEndpoint(
		f.Destination, f.DestinationNames, Destination,
	)

	return senderSvc, receiverSvc
}

func ServiceIdsFromFlow(f *flow.Flow) (string, string) {
	sourceProps := labels.Props(f.Source.Labels)
	destProps := labels.Props(f.Destination.Labels)

	sourceSvcId := getServiceId(
		f.Source, f.SourceNames, sourceProps, Source,
	)

	destSvcId := getServiceId(
		f.Destination, f.DestinationNames, destProps, Destination,
	)

	return sourceSvcId, destSvcId
}

func serviceFromEndpoint(
	ep *flow.Endpoint,
	dnsNames []string,
	side Side,
) *ui.Service {
	lblProps := labels.Props(ep.Labels)
	serviceId := getServiceId(ep, dnsNames, lblProps, side)

	serviceName := fmt.Sprintf("%v", serviceId)
	if lblProps.AppName != nil {
		serviceName = *lblProps.AppName
	}

	return &ui.Service{
		Id:                     serviceId,
		Name:                   serviceName,
		Namespace:              ep.Namespace,
		Labels:                 ep.Labels,
		DnsNames:               dnsNames,
		EgressPolicyEnforced:   false,
		IngressPolicyEnforced:  false,
		VisibilityPolicyStatus: "",
		CreationTimestamp:      ptypes.TimestampNow(),
	}
}

func getServiceId(
	ep *flow.Endpoint,
	dnsNames []string,
	lblProps *labels.LabelProps,
	side Side,
) string {

	if lblProps.IsWorld && len(dnsNames) > 0 {
		sideStr := "source"
		if side == Destination {
			sideStr = "destination"
		}

		return fmt.Sprintf("%s-%s", dnsNames[0], sideStr)
	}

	return fmt.Sprintf("%v", ep.Identity)
}
