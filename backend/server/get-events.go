package server

import (
	"time"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/link"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

const (
	FLOW_EVENT          = ui.EventType_FLOW
	FLOWS_EVENT         = ui.EventType_FLOWS
	NS_STATE_EVENT      = ui.EventType_K8S_NAMESPACE_STATE
	SERVICE_STATE_EVENT = ui.EventType_SERVICE_STATE
	SERVICE_LINK_EVENT  = ui.EventType_SERVICE_LINK_STATE
)

type EventStream = ui.UI_GetEventsServer
type FlowStream = observer.Observer_GetFlowsClient

func (srv *UIServer) GetEvents(
	req *ui.GetEventsRequest, stream EventStream,
) error {
	if len(req.EventTypes) == 0 {
		log.Infof("no events specified, aborted.\n")
		return nil
	}

	cache := srv.dataCache.Empty()
	flowsLimiter := flow.NewLimiter(500 * time.Millisecond)
	eventsRequested := getFlagsWhichEventsRequested(req.EventTypes)

	var flowResponses chan *ui.GetEventsResponse
	var flowErrors chan error
	var flowCancel func()

	if eventsRequested.FlowsRequired() {
		flowCancel, flowResponses, flowErrors = srv.GetFlows(req)
		defer flowCancel()
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
		case <-stream.Context().Done():
			break F
		case err := <-flowErrors:
			log.Errorf("flow error: %v\n", err)
			if !srv.IsGrpcUnavailable(err) {
				flowCancel()
				return err
			}

		case flows := <-flowsLimiter.Flushed:
			flowsResponse := eventResponseFromRawFlows(flows)
			if flowsResponse == nil {
				continue
			}

			log.Infof("sending bunch of flows: %v\n", len(flows))
			if err := stream.Send(flowsResponse); err != nil {
				log.Errorf("failed to send buffered flows response: %v\n", err)
				return err
			}
		case flowResponse := <-flowResponses:
			if flowResponse == nil {
				break F
			}

			flowsLimiter.Push(flowResponse.GetFlow())

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

	log.Infof("GetEvents: stream is canceled\n")
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

		if resp := handleSvc(senderSvc, cache); resp != nil {
			svcResponses = append(svcResponses, resp)
		}

		if resp := handleSvc(receiverSvc, cache); resp != nil {
			svcResponses = append(svcResponses, resp)
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

func handleSvc(svc *service.Service, cache *dataCache) *ui.GetEventsResponse {
	if svc.Id() == "0" {
		log.Infof("%s svc identity == 0\n", svc.Side())
		return nil
	}

	flags := cache.UpsertService(svc)
	if !flags.Changed() {
		return nil
	}

	log.Infof("Service changed: %s", svc)
	return eventResponseForService(svc, flags)

}
