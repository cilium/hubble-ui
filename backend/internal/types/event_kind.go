package types

type EventKind string

const (
	Added    EventKind = "added"
	Modified EventKind = "modified"
	Deleted  EventKind = "deleted"
	Exists   EventKind = "exists"
	Unknown  EventKind = "unknown"
)
