package server

import (
	"context"
	"io"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/cilium/api/v1/relay"
)

const (
	FLOW_EVENT          = relay.RelayEventType_FLOW
	NS_STATE_EVENT      = relay.RelayEventType_K8S_NAMESPACE_STATE
	SERVICE_STATE_EVENT = relay.RelayEventType_SERVICE_STATE
	SERVICE_LINK_EVENT  = relay.RelayEventType_SERVICE_LINK_STATE
)

type EventStream = relay.HubbleRelay_GetEventsServer
type FlowStream = observer.Observer_GetFlowsClient

func (srv *RelayServer) GetEvents(
	req *relay.GetEventsRequest, stream EventStream,
) error {
	if len(req.EventTypes) == 0 {
		log.Infof("no events specified, aborted.\n")
		return nil
	}

	flowEvent := eventRequested(req.EventTypes, FLOW_EVENT)
	sStateEvent := eventRequested(req.EventTypes, SERVICE_STATE_EVENT)
	sLinkEvent := eventRequested(req.EventTypes, SERVICE_LINK_EVENT)

	var flowSource FlowStream = nil
	if flowEvent || sStateEvent || sLinkEvent {
		fs, cancel, err := srv.GetFlows(req)

		if err != nil {
			log.Errorf("failed to GetFlows: %v\n", err)
			return err
		}

		flowSource = fs
		defer cancel()
	}

	var nsSource chan *NSEvent
	if eventRequested(req.EventTypes, NS_STATE_EVENT) {
		watcherChan, stop := srv.RunNSWatcher()
		defer close(stop)

		nsSource = watcherChan
	}

	flowDrain, handleFlows := handleFlowStream(
		flowSource,
		flowEvent,
		sStateEvent,
		sLinkEvent,
	)

	if handleFlows != nil {
		go handleFlows()
	}

	nsDrain := make(chan *relay.GetEventsResponse)
	go handleNsEvents(nsSource, nsDrain)

	defer close(nsDrain)

F:
	for {
		select {
		case flowEvent := <-flowDrain:
			if flowEvent == nil {
				break F
			}

			if err := stream.Send(flowEvent); err != nil {
				break F
			}
		case nsEvent := <-nsDrain:
			if err := stream.Send(nsEvent); err != nil {
				break F
			}
		}
	}

	return nil
}

func handleNsEvents(src chan *NSEvent, drain chan *relay.GetEventsResponse) {
	for e := range src {
		resp := respFromNSEvent(e)

		drain <- resp
	}
}

func handleFlowStream(
	src FlowStream,
	flowEvent bool,
	sStateEvent bool,
	sLinkEvent bool,
) (chan *relay.GetEventsResponse, func()) {
	if src == nil {
		return nil, nil
	}

	drain := make(chan *relay.GetEventsResponse)
	svcCache := newServiceCache()

	// TODO: do recovery when src.Recv() returns error
	thread := func() {
		for {
			flowResponse, err := src.Recv()
			if err == io.EOF || err == context.Canceled {
				log.Infof("flow stream is closed\n")
				break
			}

			if err != nil {
				if status.Code(err) == codes.Canceled {
					log.Infof("flow stream is closed\n")
					break
				}

				log.Warnf("flow stream error: %v\n", err)
			}

			flow := flowResponse.GetFlow()
			if flow == nil {
				continue
			}

			log.Infof("flow: %v\n", flow)

			if flowEvent {
				// Raw flow event sending
				drain <- &relay.GetEventsResponse{
					Node:      flowResponse.NodeName,
					Timestamp: flowResponse.Time,
					Event:     &relay.GetEventsResponse_Flow{flow},
				}
			}

			if sStateEvent {
				senderEvent, receiverEvent := svcCache.FromFlow(flow)

				// Service state event (only EXISTS state is handled)
				if senderEvent != nil {
					drain <- senderEvent
				}

				if receiverEvent != nil {
					drain <- receiverEvent
				}
			}

			if sLinkEvent {
				// Service Link event (only EXISTS state is handled)
				linkEvent := svcCache.LinkFromFlow(flow)

				if linkEvent != nil {
					drain <- linkEvent
				}
			}
		}

		log.Infof("sending flows stopped\n")
		close(drain)
	}

	return drain, thread
}

func eventRequested(events []relay.RelayEventType, et ...relay.RelayEventType) bool {
	for _, t := range events {
		for _, tt := range et {
			if t == tt {
				return true
			}
		}
	}

	return false
}
