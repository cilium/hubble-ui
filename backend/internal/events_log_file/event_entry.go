package events_log_file

import (
	"github.com/cilium/cilium/api/v1/observer"
	"google.golang.org/protobuf/encoding/protojson"
)

type EventEntry struct {
	Flow     *observer.GetFlowsResponse
	Unparsed *string
}

func tryParseFlow(str string) (*EventEntry, error) {
	flowEvent := &observer.GetFlowsResponse{}
	err := protojson.Unmarshal([]byte(str), flowEvent)
	if err != nil {
		return nil, err
	}

	return &EventEntry{
		Flow: flowEvent,
	}, nil
}
