package server

import (
	"time"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/domain/cache"
	"github.com/cilium/hubble-ui/backend/domain/flow"
	"github.com/cilium/hubble-ui/backend/domain/link"
	"github.com/cilium/hubble-ui/backend/domain/service"
	"github.com/cilium/hubble-ui/backend/internal/msg"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"github.com/cilium/hubble-ui/backend/server/helpers"
)

type EventStream = ui.UI_GetEventsServer
type FlowStream = observer.Observer_GetFlowsClient

func (srv *UIServer) GetEvents(
	req *ui.GetEventsRequest, stream EventStream,
) error {
	if len(req.EventTypes) == 0 {
		log.Infof(msg.NoEventsRequired)
		return nil
	}

	connState := helpers.NewGetEventsState()
	cache := srv.dataCache.Empty()
	flowsLimiter := flow.NewLimiter(500 * time.Millisecond)
	eventsRequested := helpers.GetFlagsWhichEventsRequested(req.EventTypes)

	var flowResponses chan *ui.GetEventsResponse
	var flowErrors chan error
	var flowCancel func()

	if eventsRequested.FlowsRequired() {
		flowCancel, flowResponses, flowErrors = srv.GetFlows(req)
		defer flowCancel()
	}

	var nsSource chan *helpers.NSEvent
	var nsErrors chan error
	if eventsRequested.Namespaces {
		watcherChan, errors, stop := srv.RunNSWatcher()
		defer close(stop)

		nsErrors = errors
		nsSource = watcherChan
	}

	var statuses chan *ui.GetEventsResponse
	var statusErrors chan error
	var statusCancel func()

	if eventsRequested.Status {
		log.Infof(msg.HubbleStatusCheckerIsRunning)
		statusCancel, statuses, statusErrors = srv.RunStatusChecker(
			req.StatusRequest,
		)

		defer statusCancel()
	}

F:
	for {
		select {
		case <-stream.Context().Done():
			break F
		case err := <-flowErrors:
			log.Errorf(msg.FlowsError, err)
			if !srv.IsGrpcUnavailable(err) {
				flowCancel()
				return err
			}

			// NOTE: We are here if someone is reconnecting to hubble-relay
			if evt := connState.ShouldNotifyOnReconnecting(); evt != nil {
				if err := stream.Send(evt); err != nil {
					log.Errorf(msg.SendConnStateError, "OnReconnecting", err)
					break F
				}
			}
		case err := <-statusErrors:
			if !srv.IsGrpcUnavailable(err) {
				log.Errorf(msg.HubbleStatusCriticalError, err)
				return err
			}

			log.Errorf(msg.HubbleStatusRelayUnavailableError, err)
		case err := <-nsErrors:
			if helpers.IsTimeout(err) {
				log.Warnf(msg.NSWatcherK8sTimeoutError, err)
				break
			}

			if !helpers.IsServiceUnavailable(err) {
				log.Errorf(msg.NSWatcherUnknownError, err)
			}

			log.Errorf(msg.NSWatcherK8sUnavailableError, err)

			k8sUnavailableEvt := connState.ShouldNotifyOnK8sUnavailable()
			if k8sUnavailableEvt == nil {
				break
			}

			if err := stream.Send(k8sUnavailableEvt); err != nil {
				log.Errorf(msg.SendK8sUnavailableNotifError, err)
				return err
			}
		case flows := <-flowsLimiter.Flushed:
			flowsResponse := helpers.EventResponseFromRawFlows(flows)
			if flowsResponse == nil {
				continue
			}

			if err := stream.Send(flowsResponse); err != nil {
				log.Errorf(msg.SendFlowsError, err)
				return err
			}
		case nsEvent := <-nsSource:
			resp := helpers.EventResponseFromNSEvent(nsEvent)

			if err := stream.Send(resp); err != nil {
				log.Errorf(msg.SendNamespaceEventError, err)
				return err
			}

			k8sConnectedEvt := connState.ShouldNotifyOnK8sConnected()
			if k8sConnectedEvt == nil {
				break
			}

			if err := stream.Send(k8sConnectedEvt); err != nil {
				log.Errorf(msg.SendK8sConnectedNotifError, err)
				return err
			}
		case flowResponse := <-flowResponses:
			if flowResponse == nil {
				break F
			}

			if evt := connState.ShouldNotifyOnConnected(); evt != nil {
				if err := stream.Send(evt); err != nil {
					log.Errorf(msg.SendConnStateError, "OnConnected", err)
					break F
				}
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
					log.Errorf(msg.SendServiceEventError, err)
					return err
				}
			}

			for _, linkEvent := range links {
				if err := stream.Send(linkEvent); err != nil {
					log.Errorf(msg.SendLinkEventError, err)
					return err
				}
			}
		case statusEvent := <-statuses:
			if err := stream.Send(statusEvent); err != nil {
				log.Errorf(msg.SendHubbleStatusError, err)
				return err
			}
		}
	}

	log.Infof(msg.BackendToUIStreamIsClosed)
	return nil
}

func extractDerivedEvents(
	flowResponse *ui.GetEventsResponse,
	eventsRequested *helpers.EventFlags,
	cache *cache.DataCache,
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
			log.Debugf(msg.LinkBetweenServicesChanged, serviceLink)
			linkEvent := helpers.EventResponseForLink(serviceLink, flags)

			linkResponses = append(linkResponses, linkEvent)
		}
	}

	return
}

func handleSvc(svc *service.Service, cache *cache.DataCache) *ui.GetEventsResponse {
	if svc.Id() == "0" {
		log.Debugf(msg.SkippingZeroIdentitySvc, svc.Side())
		return nil
	}

	flags := cache.UpsertService(svc)
	if !flags.Changed() {
		return nil
	}

	log.Debugf(msg.ServiceChanged, svc)
	return helpers.EventResponseForService(svc, flags)

}
