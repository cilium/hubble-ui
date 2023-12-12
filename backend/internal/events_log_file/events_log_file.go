package events_log_file

import (
	"github.com/cilium/hubble-ui/backend/internal/log_file"
)

type EventsLogFileIterator struct {
	ji *log_file.JsonIterator
}

func NewEventsIterator(ji *log_file.JsonIterator) *EventsLogFileIterator {
	return &EventsLogFileIterator{
		ji: ji,
	}
}

func (it *EventsLogFileIterator) Next() *EventEntry {
	next := it.ji.Next()
	if next == "" {
		return nil
	}

	flow, _ := tryParseFlow(next)
	if flow != nil {
		return flow
	}

	return &EventEntry{
		Unparsed: &next,
	}
}

func (it *EventsLogFileIterator) HasNext() bool {
	return it.ji.HasNext()
}
