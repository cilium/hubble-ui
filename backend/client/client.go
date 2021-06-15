package client

import (
	"context"
	"os"

	"github.com/golang/protobuf/jsonpb"
	"github.com/golang/protobuf/ptypes"
	"google.golang.org/grpc"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/hubble-ui/backend/pkg/logger"
	"github.com/cilium/hubble-ui/backend/proto/ui"
)

var (
	log = logger.New("ui-client")
)

type Client struct {
	addr string
}

func New(addr string) *Client {
	return &Client{addr}
}

func (cl *Client) Run() {
	conn, err := grpc.Dial(cl.addr, grpc.WithInsecure())
	if err != nil {
		log.Errorf("failed to connect to grpc server: %v\n", err)
		os.Exit(1)
	}

	log.Infof("grpc client successfully created\n")
	uiClient := ui.NewUIClient(conn)

	cl.RunStream(uiClient)
}

func (cl *Client) RunStream(uiClient ui.UIClient) {
	ctx := context.Background()
	req := prepareRequest()

	stream, err := uiClient.GetEvents(ctx, req)
	if err != nil {
		log.Errorf("failed to GetEvents: %v\n", err)
		os.Exit(1)
	}

	m := jsonpb.Marshaler{}

	for {
		data, err := stream.Recv()
		if err != nil {
			log.Errorf("failed to receive an event from server: %v\n", err)
			os.Exit(1)
		}

		result, err := m.MarshalToString(data)

		if err != nil {
			log.Errorf("failed to make json from message: %v\n", err)
		} else {
			log.Infof("received event message: %s\n", result)
		}
	}
}

func prepareRequest() *ui.GetEventsRequest {
	flowFilter := &flow.FlowFilter{}

	return &ui.GetEventsRequest{
		EventTypes: []ui.EventType{
			// ui.EventType_FLOW,
			ui.EventType_SERVICE_STATE,
			ui.EventType_SERVICE_LINK_STATE,
			ui.EventType_K8S_NAMESPACE_STATE,
		},
		Since: ptypes.TimestampNow(),
		Whitelist: []*ui.EventFilter{
			{
				Filter: &ui.EventFilter_FlowFilter{flowFilter},
			},
		},
	}
}
