package events

type EventKind string

const (
	Added    EventKind = "added"
	Modified EventKind = "modified"
	Deleted  EventKind = "deleted"
	Exists   EventKind = "exists"
	Unknown  EventKind = "unknown"
)

func (ek EventKind) IsChanged() bool {
	return ek == Added || ek == Modified || ek == Deleted
}
