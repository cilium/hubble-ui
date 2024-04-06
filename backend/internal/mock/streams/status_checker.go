package streams

import (
	"context"
	"math"
	"sync"
	"time"

	"github.com/cilium/cilium/api/v1/observer"
	"github.com/cilium/cilium/api/v1/relay"
	"github.com/sirupsen/logrus"
	"google.golang.org/protobuf/types/known/wrapperspb"

	"github.com/cilium/hubble-ui/backend/internal/statuschecker"
)

type StatusChecker struct {
	log      logrus.FieldLogger
	stopOnce sync.Once
	stopCh   chan struct{}
	errCh    chan error
	statusCh chan *statuschecker.FullStatus
}

func NewStatusChecker(log logrus.FieldLogger) *StatusChecker {
	return &StatusChecker{
		log:      log,
		stopOnce: sync.Once{},
		stopCh:   make(chan struct{}),
		errCh:    make(chan error),
		statusCh: make(chan *statuschecker.FullStatus),
	}
}

func (sc *StatusChecker) Run(ctx context.Context) {
	sc.log.Info("running")

	for {
		select {
		case <-ctx.Done():
			sc.log.Info("context done")
			return
		case <-sc.stopCh:
			sc.log.Info("checker is stopped")
			return
		case sc.statusCh <- sc.nextFullStatus():
			sc.log.Info("status sent")

			// NOTE: Returning since we only have one static response
			return
		}
	}
}

func (sc *StatusChecker) Stop() {
	sc.log.Info("stop is called")

	sc.stopOnce.Do(func() {
		close(sc.stopCh)
		sc.log.Info("stop channel is closed")
	})
}

func (sc *StatusChecker) Errors() chan error {
	return sc.errCh
}

func (sc *StatusChecker) Statuses() chan *statuschecker.FullStatus {
	return sc.statusCh
}

func (sc *StatusChecker) nextFullStatus() *statuschecker.FullStatus {
	nodes := sc.genNodesResponse()
	status := sc.genStatusResponse(nodes.GetNodes())

	return &statuschecker.FullStatus{
		Nodes:  nodes,
		Status: status,
	}
}

func (sc *StatusChecker) genStatusResponse(nodes []*observer.Node) *observer.ServerStatusResponse {
	var numFlows, maxFlows, seenFlows, uptimeNs uint64
	var version string

	numConnectedNodes := wrapperspb.UInt32(0)
	unavailNodes := []string{}

	for _, node := range nodes {
		numFlows += node.GetNumFlows()
		maxFlows += node.GetMaxFlows()
		seenFlows += node.GetSeenFlows()
		uptimeNs = uint64(math.Max(float64(uptimeNs), float64(node.GetUptimeNs())))
		version = node.GetVersion()

		if node.GetState() == relay.NodeState_NODE_UNAVAILABLE {
			unavailNodes = append(unavailNodes, node.GetName())
		} else {
			numConnectedNodes.Value += uint32(1)
		}
	}

	return &observer.ServerStatusResponse{
		NumFlows:            numFlows,
		MaxFlows:            maxFlows,
		SeenFlows:           seenFlows,
		UptimeNs:            uptimeNs,
		NumConnectedNodes:   numConnectedNodes,
		NumUnavailableNodes: wrapperspb.UInt32(uint32(len(unavailNodes))),
		UnavailableNodes:    unavailNodes,
		Version:             version,
	}
}

func (sc *StatusChecker) genNodesResponse() *observer.GetNodesResponse {
	tls := &observer.TLS{
		Enabled:    true,
		ServerName: "hubble-relay",
	}

	uptime := time.Hour * time.Duration(48)

	nodes := []*observer.Node{
		{
			Name:      "e2e-unknown-state-node",
			Version:   "1.15-rc.2",
			Address:   "10.43.138.71",
			State:     relay.NodeState_UNKNOWN_NODE_STATE,
			Tls:       tls,
			UptimeNs:  uint64(uptime.Nanoseconds()),
			NumFlows:  1024,
			MaxFlows:  65536,
			SeenFlows: 32768,
		},
		{
			Name:      "e2e-connected-node",
			Version:   "1.15-rc.2",
			Address:   "10.43.138.72",
			State:     relay.NodeState_NODE_CONNECTED,
			Tls:       tls,
			UptimeNs:  uint64(uptime.Nanoseconds()),
			NumFlows:  2048,
			MaxFlows:  65536,
			SeenFlows: 32768,
		},
		{
			Name:      "e2e-unavailable-node",
			Version:   "1.15-rc.2",
			Address:   "10.43.138.73",
			State:     relay.NodeState_NODE_UNAVAILABLE,
			Tls:       tls,
			UptimeNs:  uint64(uptime.Nanoseconds()),
			NumFlows:  4096,
			MaxFlows:  65536,
			SeenFlows: 32768,
		},
		{
			Name:      "e2e-gone-node",
			Version:   "1.15-rc.2",
			Address:   "10.43.138.74",
			State:     relay.NodeState_NODE_GONE,
			Tls:       tls,
			UptimeNs:  uint64(uptime.Nanoseconds()),
			NumFlows:  8192,
			MaxFlows:  65536,
			SeenFlows: 32768,
		},
		{
			Name:      "e2e-error-node",
			Version:   "1.15-rc.2",
			Address:   "10.43.138.75",
			State:     relay.NodeState_NODE_ERROR,
			Tls:       tls,
			UptimeNs:  uint64(uptime.Nanoseconds()),
			NumFlows:  16384,
			MaxFlows:  65536,
			SeenFlows: 32768,
		},
	}

	return &observer.GetNodesResponse{
		Nodes: nodes,
	}
}
