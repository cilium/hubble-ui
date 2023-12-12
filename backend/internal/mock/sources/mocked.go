package sources

import (
	"context"

	pbFlow "github.com/cilium/cilium/api/v1/flow"
	ns_common "github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
)

type NSEventChannel chan *ns_common.NSEvent
type FlowsChannel chan *pbFlow.Flow

type MockedSource interface {
	Namespaces() NSEventChannel
	Flows() FlowsChannel

	Run(context.Context)
	Stop()
	Stopped() chan struct{}

	// NOTE: The thing is that we would like to use the same data from source
	// for multiple clients/streams, this method is attempt to simulate that
	// broadcast behavior
	Duplicate() MockedSource
}
