package client

import (
	"context"
	"os"

	"github.com/golang/protobuf/jsonpb"
	"github.com/golang/protobuf/ptypes"
	"google.golang.org/grpc"

	"github.com/cilium/cilium/api/v1/flow"
	"github.com/cilium/cilium/api/v1/relay"
	"github.com/cilium/hubble-ui/events-server/logger"
)

var (
	log = logger.New("relay-client")
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
	relayClient := relay.NewHubbleRelayClient(conn)

	cl.RunStream(relayClient)
}

func (cl *Client) RunStream(relayClient relay.HubbleRelayClient) {
	ctx := context.Background()
	req := prepareRequest()

	stream, err := relayClient.GetEvents(ctx, req)
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

func prepareRequest() *relay.GetEventsRequest {
	flowFilter := &flow.FlowFilter{}

	return &relay.GetEventsRequest{
		EventTypes: []relay.RelayEventType{
			// relay.RelayEventType_FLOW,
			relay.RelayEventType_SERVICE_STATE,
			relay.RelayEventType_SERVICE_LINK_STATE,
			relay.RelayEventType_K8S_NAMESPACE_STATE,
		},
		Since: ptypes.TimestampNow(),
		Whitelist: []*relay.RelayEventFilter{
			{
				Filter: &relay.RelayEventFilter_FlowFilter{flowFilter},
			},
		},
	}
}
