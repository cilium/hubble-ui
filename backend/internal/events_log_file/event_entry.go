package events_log_file

import (
	"encoding/json"
	"log/slog"

	observerpb "github.com/cilium/cilium/api/v1/observer"
	"google.golang.org/protobuf/encoding/protojson"
)

type EventEntry struct {
	Flow           *observerpb.GetFlowsResponse
	FlowParseError error

	PEParseError error

	Unparsed *string
}

func tryParseFlow(str string) (*EventEntry, error) {
	flowEvent := &observerpb.GetFlowsResponse{}
	err := protojson.Unmarshal([]byte(str), flowEvent)
	if err != nil {
		return nil, err
	}

	return &EventEntry{
		Flow: flowEvent,
	}, nil
}

func (ee *EventEntry) LogAttrs() []any {
	attrs := []any{
		slog.Any("flow-parse-error", ee.FlowParseError),
		slog.Any("pe-parse-error", ee.PEParseError),
	}

	if ee.Unparsed != nil {
		attrs = append(attrs, slog.String("unparsed", *ee.Unparsed))
	}

	if ee.Flow != nil {
		str, err := json.Marshal(ee.Flow)
		if err != nil {
			str = []byte{}
		}

		attrs = append(attrs, slog.String("flow", string(str)))
	}

	return attrs
}
