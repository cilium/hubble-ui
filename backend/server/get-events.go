package server

import (
	"context"
	"io"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/cilium/cilium/api/v1/observer"
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

	eventsRequested := getFlagsWhichEventsRequested(req.EventTypes)

	var flowSource FlowStream = nil
	if eventsRequested.FlowsRequired() {
		fs, cancel, err := srv.GetFlows(req)

		if err != nil {
			log.Errorf("failed to GetFlows: %v\n", err)
			return err
		}

		flowSource = fs
		defer cancel()
	}

	var nsSource chan *NSEvent
	if eventsRequested.Namespaces {
		watcherChan, stop := srv.RunNSWatcher()
		defer close(stop)

		nsSource = watcherChan
	}

	flowDrain, flowErr, handleFlows := handleFlowStream(
		flowSource,
		eventsRequested,
		srv.serviceCache,
	)

	if handleFlows != nil {
		go handleFlows()
	}

	nsDrain := make(chan *ui.GetEventsResponse)
	go handleNsEvents(nsSource, nsDrain)

	defer close(nsDrain)

F:
	for {
		select {
		case err := <-flowErr:
			return err
		case flowEvent := <-flowDrain:
			if flowEvent == nil {
				break F
			}

			if err := stream.Send(flowEvent); err != nil {
				log.Infof("send failed: %v\n", err)
				return err
			}
		case nsEvent := <-nsDrain:
			if err := stream.Send(nsEvent); err != nil {
				log.Infof("send failed: %v\n", err)
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

func handleFlowStream(
	src FlowStream,
	eventsRequested *eventFlags,
	svcCache *serviceCache,
) (chan *ui.GetEventsResponse, chan error, func()) {
	if src == nil {
		return nil, nil, nil
	}

	drain := make(chan *ui.GetEventsResponse)
	errch := make(chan error)

	// TODO: do recovery when src.Recv() returns error
	thread := func() {
		defer close(drain)
		defer close(errch)

		for {
			flowResponse, err := src.Recv()
			if err == io.EOF {
				log.Infof("flow stream is exhausted (EOF)\n")
				errch <- err
				break
			}

			if err != nil {
				codeIsCanceled := status.Code(err) == codes.Canceled
				if codeIsCanceled || err == context.Canceled {
					log.Infof("flow stream is canceled\n")
				} else {
					log.Warnf("flow stream error: %v\n", err)
				}

				errch <- err
				break
			}

			flow := flowResponse.GetFlow()
			if flow == nil {
				continue
			}

			if eventsRequested.Flows {
				drain <- &ui.GetEventsResponse{
					Node:      flowResponse.NodeName,
					Timestamp: flowResponse.Time,
					Event:     &ui.GetEventsResponse_Flow{flow},
				}
			}

			if eventsRequested.Services {
				senderEvent, receiverEvent := svcCache.FromFlow(flow)

				// Service state event (only EXISTS state is handled)
				if senderEvent != nil {
					drain <- senderEvent
				}

				if receiverEvent != nil {
					drain <- receiverEvent
				}
			}

			if eventsRequested.ServiceLinks {
				// Service Link event (only EXISTS state is handled)
				linkEvent := svcCache.LinkFromFlow(flow)

				if linkEvent != nil {
					drain <- linkEvent
				}
			}
		}

		log.Infof("flows sending stopped\n")
	}

	return drain, errch, thread
}
