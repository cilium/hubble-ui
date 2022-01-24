package server

import (
	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/hubble-ui/backend/internal/server/nswatcher/common"
	"github.com/cilium/hubble-ui/backend/proto/ui"
	"github.com/cilium/hubble-ui/backend/server/helpers"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (srv *UIServer) GetControlStream(
	req *ui.GetControlStreamRequest,
	stream ui.UI_GetControlStreamServer,
) error {
	nsWatcher, err := srv.CreateNSWatcher(stream.Context())
	if err != nil {
		return err
	}

	go nsWatcher.Run(stream.Context())
	defer nsWatcher.Stop()

	statusChecker, err := srv.RunStatusChecker(stream.Context())
	if err != nil {
		return status.Error(codes.Internal, err.Error())
	}

	go statusChecker.Run(stream.Context())
	defer statusChecker.Stop()

F:
	for {
		select {
		case <-stream.Context().Done():
			break F
		case evt := <-nsWatcher.NSEvents():
			nsResponse := responseFromNSEvent(evt)

			if err := stream.Send(nsResponse); err != nil {
				log.Errorf("failed to send ns response: %v\n", err)
				return err
			}
		case err := <-nsWatcher.Errors():
			log.Errorf("ns watcher error: %v\n", err)
			return err
		case deploymentStatus := <-statusChecker.Statuses():
			evt := serverStatusResponse(deploymentStatus)

			if err := stream.Send(evt); err != nil {
				log.Errorf("failed to send server status notification: %v\n", err)
				return err
			}
		case err := <-statusChecker.Errors():
			log.Errorf("status checker error: %v\n", err)
			return err
		}
	}

	log.Infof("control stream is stopped\n")
	return nil
}

func responseFromNSEvent(
	nsEvent *common.NSEvent,
) *ui.GetControlStreamResponse {
	nsStateChanges := []*ui.K8SNamespaceState{{
		Namespace: nsEvent.IntoK8sNamespaceProto(),
		Type:      helpers.StateChangeFromEventType(nsEvent.Event),
	}}

	return &ui.GetControlStreamResponse{
		Event: &ui.GetControlStreamResponse_Namespaces{
			Namespaces: &ui.GetControlStreamResponse_NamespaceStates{
				Namespaces: nsStateChanges,
			},
		},
	}
}

func serverStatusResponse(
	ss *observer.ServerStatusResponse,
) *ui.GetControlStreamResponse {
	return &ui.GetControlStreamResponse{
		Event: &ui.GetControlStreamResponse_Notification{
			Notification: helpers.ServerStatusNotification(ss),
		},
	}
}
