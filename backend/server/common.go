package server

type EventKind string

const (
	Added    EventKind = "added"
	Modified EventKind = "modified"
	Deleted  EventKind = "deleted"
	Exists   EventKind = "exists"
	Unknown  EventKind = "unknown"
)

type eventFlags struct {
	Flow            bool
	Flows           bool
	Services        bool
	ServiceLinks    bool
	Namespaces      bool
	NetworkPolicies bool
}

func (ef *eventFlags) FlowsRequired() bool {
	return ef.Flow || ef.Flows || ef.Services || ef.ServiceLinks
}
