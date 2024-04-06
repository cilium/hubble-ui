package notifications

type NoPermissionsMap map[string]*Notification

type Notifications struct {
	RelayConnected  bool
	RelayConnecting bool

	IsK8sUnavailable bool
	IsK8sConnected   bool

	reconnectingToRelayNotif *Notification
	connectedToRelayNotif    *Notification

	k8sUnavailableNotif *Notification
	k8sConnectedNotif   *Notification

	noPermission NoPermissionsMap
}

func NewNotificationsState() *Notifications {
	return &Notifications{
		RelayConnected:   true,
		RelayConnecting:  false,
		IsK8sUnavailable: false,
		IsK8sConnected:   true,

		reconnectingToRelayNotif: nil,
		connectedToRelayNotif:    nil,
		k8sUnavailableNotif:      nil,
		k8sConnectedNotif:        nil,
		noPermission:             make(NoPermissionsMap),
	}
}

func (ges *Notifications) ReconnectingToRelay() *Notification {
	if ges.reconnectingToRelayNotif != nil || ges.RelayConnecting {
		return nil
	}

	ges.RelayConnected = false
	ges.RelayConnecting = true
	ges.connectedToRelayNotif = nil
	ges.reconnectingToRelayNotif = NewRelayReconnecting()

	return ges.reconnectingToRelayNotif
}

func (ges *Notifications) ConnectedToRelay() *Notification {
	if ges.connectedToRelayNotif != nil || ges.RelayConnected {
		return nil
	}

	ges.RelayConnected = true
	ges.RelayConnecting = false
	ges.reconnectingToRelayNotif = nil
	ges.connectedToRelayNotif = NewRelayConnected()

	return ges.connectedToRelayNotif
}

func (ges *Notifications) ShouldNotifyOnK8sUnavailable() *Notification {
	if ges.k8sUnavailableNotif != nil || ges.IsK8sUnavailable {
		return nil
	}

	ges.IsK8sConnected = false
	ges.k8sConnectedNotif = nil
	ges.IsK8sUnavailable = true
	ges.k8sUnavailableNotif = NewK8sUnavailable()

	return ges.k8sUnavailableNotif
}

func (ges *Notifications) K8sConnected() *Notification {
	if ges.k8sConnectedNotif != nil || ges.IsK8sConnected {
		return nil
	}

	ges.IsK8sConnected = true
	ges.k8sConnectedNotif = NewK8sConnected()
	ges.IsK8sUnavailable = false
	ges.k8sUnavailableNotif = nil

	return ges.k8sConnectedNotif
}

func (ges *Notifications) NoPermission(
	err error, resource string,
) *Notification {
	_, exists := ges.noPermission[resource]
	if exists {
		return nil
	}

	evt := NewNoPermission(resource, err.Error())
	ges.noPermission[resource] = evt

	return evt
}
