package helpers

import "github.com/cilium/hubble-ui/backend/proto/ui"

type GetEventsState struct {
	Connected  bool
	Connecting bool

	reconnectingEvent *ui.GetEventsResponse
	connectedEvent    *ui.GetEventsResponse
}

func NewGetEventsState() *GetEventsState {
	return &GetEventsState{true, false, nil, nil}
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
