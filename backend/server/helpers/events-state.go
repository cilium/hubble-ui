package helpers

import "github.com/cilium/hubble-ui/backend/proto/ui"

type NoPermissionsMap map[string]*ui.GetEventsResponse

type GetEventsState struct {
	Connected      bool
	Connecting     bool
	K8sUnavailable bool
	K8sConnected   bool

	reconnectingEvent   *ui.GetEventsResponse
	connectedEvent      *ui.GetEventsResponse
	k8sUnavailableEvent *ui.GetEventsResponse
	k8sConnectedEvent   *ui.GetEventsResponse
	noPermission        NoPermissionsMap
}

func NewGetEventsState() *GetEventsState {
	return &GetEventsState{
		Connected:           true,
		Connecting:          false,
		K8sUnavailable:      false,
		K8sConnected:        true,
		reconnectingEvent:   nil,
		connectedEvent:      nil,
		k8sUnavailableEvent: nil,
		k8sConnectedEvent:   nil,
		noPermission:        make(NoPermissionsMap),
	}
}

func (ges *GetEventsState) ShouldNotifyOnReconnecting() *ui.GetEventsResponse {
	if ges.reconnectingEvent != nil || ges.Connecting {
		return nil
	}

	ges.Connected = false
	ges.Connecting = true
	ges.connectedEvent = nil
	ges.reconnectingEvent = EventResponseReconnecting()

	return ges.reconnectingEvent
}

func (ges *GetEventsState) ShouldNotifyOnConnected() *ui.GetEventsResponse {
	if ges.connectedEvent != nil || ges.Connected {
		return nil
	}

	ges.Connected = true
	ges.Connecting = false
	ges.reconnectingEvent = nil
	ges.connectedEvent = EventResponseConnected()

	return ges.connectedEvent
}

func (ges *GetEventsState) ShouldNotifyOnK8sUnavailable() *ui.GetEventsResponse {
	if ges.k8sUnavailableEvent != nil || ges.K8sUnavailable {
		return nil
	}

	ges.K8sConnected = false
	ges.k8sConnectedEvent = nil
	ges.K8sUnavailable = true
	ges.k8sUnavailableEvent = EventResponseK8sUnavailable()

	return ges.k8sUnavailableEvent
}

func (ges *GetEventsState) ShouldNotifyOnK8sConnected() *ui.GetEventsResponse {
	if ges.k8sConnectedEvent != nil || ges.K8sConnected {
		return nil
	}

	ges.K8sConnected = true
	ges.k8sConnectedEvent = EventResponseK8sConnected()
	ges.K8sUnavailable = false
	ges.k8sUnavailableEvent = nil

	return ges.k8sConnectedEvent
}

func (ges *GetEventsState) ShouldNotifyOnPermission(
	err error, resource string,
) *ui.GetEventsResponse {
	_, exists := ges.noPermission[resource]
	if exists {
		return nil
	}

	evt := EventResponseNoPermission(resource, err.Error())
	ges.noPermission[resource] = evt

	return evt
}
