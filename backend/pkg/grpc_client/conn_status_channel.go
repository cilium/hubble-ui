package grpc_client

import "github.com/cilium/hubble-ui/backend/pkg/dllist"

type ConnectionStatusKind string

const (
	Connected         ConnectionStatusKind = "connected"
	ConnectionAttempt ConnectionStatusKind = "connection-attempt"
)

type ConnectionStatus struct {
	Kind    ConnectionStatusKind
	Attempt int
}

func (cs *ConnectionStatus) IsConnected() bool {
	return cs.Kind == Connected
}

func (cs *ConnectionStatus) IsConnecting() bool {
	return cs.Kind == ConnectionAttempt
}

func (cl *GRPCClient) emitConnected() {
	cl.broadcast(ConnectionStatus{
		Kind: Connected,
	})
}

func (cl *GRPCClient) emitConnectingAttempt(attempt int) {
	cl.broadcast(ConnectionStatus{
		Kind:    ConnectionAttempt,
		Attempt: attempt,
	})
}

func (cl *GRPCClient) broadcast(st ConnectionStatus) {
	cl.subs.Iterate(func(elem *dllist.ListItem[StatusSub]) {
		sub := elem.Datum

		// NOTE: Notify only those subs who actually reads the channel
		if sub.Size() >= 5 {
			return
		}

		sub.EnqueueNonblock(st)
	})
}
