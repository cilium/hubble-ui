package events_log_file

import (
	"encoding/json"

	observerpb "github.com/cilium/cilium/api/v1/observer"
	"github.com/sirupsen/logrus"
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

func (ee *EventEntry) LogEntries() logrus.Fields {
	f := logrus.Fields{
		"flow-parse-error": ee.FlowParseError,
		"pe-parse-error":   ee.PEParseError,
	}

	if ee.Unparsed != nil {
		f["unparsed"] = *ee.Unparsed
	}

	if ee.Flow != nil {
		str, err := json.Marshal(ee.Flow)
		if err != nil {
			str = []byte{}
		}

		f["flow"] = string(str)
	}

	return f
}
