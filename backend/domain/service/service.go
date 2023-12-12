package service

import (
	"fmt"
	"sort"
	"strconv"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/cilium/hubble-ui/backend/domain/labels"
	"github.com/cilium/hubble-ui/backend/pkg/misc"
	pbUi "github.com/cilium/hubble-ui/backend/proto/ui"
)

type Service struct {
	LabelProps *labels.LabelProps

	flowRef    *pbFlow.Flow
	endpoint   *pbFlow.Endpoint
	dnsNames   []string
	isSender   bool
	isReceiver bool
}

func FromEndpointProtoAndDNS(
	f *pbFlow.Flow,
	ep *pbFlow.Endpoint,
	dnsNames []string,
) *Service {
	svc := new(Service)
	svc.flowRef = f
	svc.endpoint = ep
	svc.dnsNames = dnsNames

	svc.LabelProps = labels.Props(ep.GetLabels())

	return svc
}

func IdsFromFlowProto(f *pbFlow.Flow) (string, string) {
	sourceProps := labels.Props(f.GetSource().GetLabels())
	destProps := labels.Props(f.GetDestination().GetLabels())

	senderSvcId := getServiceId(
		f.GetSource(), f.GetSourceNames(), sourceProps, false,
	)

	receiverSvcId := getServiceId(
		f.GetDestination(), f.GetDestinationNames(), destProps, true,
	)

	return senderSvcId, receiverSvcId
}

func (s *Service) String() string {
	return fmt.Sprintf(
		"<%s %p, id: '%v', name: '%v', namespace: '%v', from flow: %p>",
		s.Side(),
		s,
		s.Id(),
		s.Name(),
		s.endpoint.GetNamespace(),
		s.flowRef,
	)
}

func (s *Service) Side() string {
	side := "Unknown"
	if s.isSender {
		side = "Sender"
	}

	if s.isReceiver {
		side = "Receiver"
	}

	return side
}

// TODO: its not ok to have this code here
func (s *Service) ToProto() *pbUi.Service {
	return &pbUi.Service{
		Id:                     s.Id(),
		Name:                   s.Name(),
		Namespace:              s.endpoint.GetNamespace(),
		Labels:                 s.endpoint.GetLabels(),
		DnsNames:               s.dnsNames,
		Workloads:              s.endpoint.GetWorkloads(),
		Identity:               s.endpoint.GetIdentity(),
		EgressPolicyEnforced:   false,
		IngressPolicyEnforced:  false,
		VisibilityPolicyStatus: "",
		CreationTimestamp:      timestamppb.Now(),
	}
}

func (s *Service) Name() string {
	serviceName := s.Id()
	if s.LabelProps.AppName != nil {
		serviceName = *s.LabelProps.AppName
	}
	return serviceName
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

func (s *Service) FlowRef() *pbFlow.Flow {
	return s.flowRef
}

func (l *Service) IsEnrichedWith(r *Service) bool {
	lworkloads := l.endpoint.GetWorkloads()
	rworkloads := r.endpoint.GetWorkloads()

	if len(rworkloads) > len(lworkloads) {
		return true
	}

	lworkloadNames := misc.MapArray(lworkloads, func(_ int, w *pbFlow.Workload) string {
		return w.GetName()
	})

	rworkloadNames := misc.MapArray(rworkloads, func(_ int, w *pbFlow.Workload) string {
		return w.GetName()
	})

	sort.Strings(lworkloadNames)
	sort.Strings(rworkloadNames)

	return !misc.ArrayEquals(lworkloadNames, rworkloadNames, func(l, r string) bool {
		return l == r
	})
}

// NOTE: This function delivers an id of service in terms of UI service cards
func getServiceId(
	ep *pbFlow.Endpoint,
	dnsNames []string,
	lblProps *labels.LabelProps,
	isReceiver bool,
) string {
	if !lblProps.IsWorld && ep.GetIdentity() > 0 {
		return strconv.FormatUint(uint64(ep.GetIdentity()), 10)
	}

	// NOTE: By some reason, workloads not available for the same service every time
	if len(ep.GetWorkloads()) > 0 {
		wl := ep.GetWorkloads()[0]
		name := wl.GetName()
		kind := wl.GetKind()

		if len(name) > 0 && len(kind) > 0 {
			return fmt.Sprintf("%s/%s", kind, name)
		}
	}

	// NOTE: We only use side prefix for world-like services
	sideStr := "sender"
	if isReceiver {
		sideStr = "receiver"
	}

	if len(dnsNames) > 0 {
		return fmt.Sprintf("%s-%s", dnsNames[0], sideStr)
	}

	return fmt.Sprintf("world-%s", sideStr)
}
