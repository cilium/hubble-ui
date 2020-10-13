package server

import (
	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/link"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

const (
	FLOW_EVENT          = ui.EventType_FLOW
	NS_STATE_EVENT      = ui.EventType_K8S_NAMESPACE_STATE
	SERVICE_STATE_EVENT = ui.EventType_SERVICE_STATE
	SERVICE_LINK_EVENT  = ui.EventType_SERVICE_LINK_STATE
)

type EventStream = ui.UI_GetEventsServer
type FlowStream = observer.Observer_GetFlowsClient

type eventFlags struct {
	Flows        bool
	Services     bool
	ServiceLinks bool
	Namespaces   bool
}

func (srv *UIServer) GetEvents(
	req *ui.GetEventsRequest, stream EventStream,
) error {
	if len(req.EventTypes) == 0 {
		log.Infof("no events specified, aborted.\n")
		return nil
	}

	cache := srv.dataCache.Empty()
	eventsRequested := getFlagsWhichEventsRequested(req.EventTypes)
	flowResponses := make(chan *ui.GetEventsResponse)
	flowErrors := make(chan error)
	var flowCancel func()

	if eventsRequested.FlowsRequired() {
		cancel, err := srv.GetFlows(req, flowResponses, flowErrors)
		if err != nil {
			log.Errorf("failed to GetFlows: %v\n", err)
			return err
		}

		flowCancel = cancel
	}

	var nsSource chan *NSEvent
	if eventsRequested.Namespaces {
		watcherChan, stop := srv.RunNSWatcher()
		defer close(stop)

		nsSource = watcherChan
	}

	nsDrain := make(chan *ui.GetEventsResponse)
	go handleNsEvents(nsSource, nsDrain)

	defer close(nsDrain)

F:
	for {
		select {
		case err := <-flowErrors:
			if !srv.IsGrpcUnavailable(err) {
				return err
			}

			flowCancel()
			cancel, err := srv.GetFlows(req, flowResponses, flowErrors)
			if err != nil {
				log.Errorf("failed to GetFlows on retry: %v\n", err)
				return err
			}

			flowCancel = cancel
		case flowResponse := <-flowResponses:
			if flowResponse == nil {
				break F
			}

			if err := stream.Send(flowResponse); err != nil {
				log.Infof("failed to send flow response: %v\n", err)
				return err
			}

			// NOTE: take links and services from flow
			links, svcs := extractDerivedEvents(
				flowResponse,
				eventsRequested,
				cache,
			)

			for _, svcEvent := range svcs {
				if err := stream.Send(svcEvent); err != nil {
					log.Infof("failed to send svc response: %v\n", err)
					return err
				}
			}

			for _, linkEvent := range links {
				if err := stream.Send(linkEvent); err != nil {
					log.Infof("failed to send link response: %v\n", err)
					return err
				}
			}
		case nsEvent := <-nsDrain:
			if err := stream.Send(nsEvent); err != nil {
				log.Infof("failed to send ns response: %v\n", err)
				return err
			}
		}
	}

	return nil
}

func handleNsEvents(src chan *NSEvent, drain chan *ui.GetEventsResponse) {
	for e := range src {
		resp := respFromNSEvent(e)

		drain <- resp
	}
}

func extractDerivedEvents(
	flowResponse *ui.GetEventsResponse,
	eventsRequested *eventFlags,
	cache *dataCache,
) (
	linkResponses []*ui.GetEventsResponse,
	svcResponses []*ui.GetEventsResponse,
) {
	if flowResponse == nil {
		return
	}

	pbFlow := flowResponse.GetFlow()
	if pbFlow == nil {
		return
	}

	f := flow.FromProto(pbFlow)

	if eventsRequested.Services {
		senderSvc, receiverSvc := f.BuildServices()

		flags := cache.UpsertService(senderSvc)
		if flags.Changed() {
			log.Infof("Service changed: %v", senderSvc)
			senderEvent := eventResponseForService(senderSvc, flags)

			svcResponses = append(svcResponses, senderEvent)
		}

		flags = cache.UpsertService(receiverSvc)
		if flags.Changed() {
			log.Infof("Service changed: %v", receiverSvc)
			receiverEvent := eventResponseForService(receiverSvc, flags)

			svcResponses = append(svcResponses, receiverEvent)
		}
	}

	if eventsRequested.ServiceLinks {
		serviceLink := link.FromFlowProto(pbFlow)

		if serviceLink == nil {
			return linkResponses, svcResponses
		}

		flags := cache.UpsertServiceLink(serviceLink)
		if flags.Changed() {
			log.Infof("Service link changed: %s", serviceLink)
			linkEvent := eventResponseForLink(serviceLink, flags)

			linkResponses = append(linkResponses, linkEvent)
		}
	}

	return
}
