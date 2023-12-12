package statuschecker

import "github.com/cilium/cilium/api/v1/observer"

type FullStatus struct {
	Nodes  *observer.GetNodesResponse
	Status *observer.ServerStatusResponse
}
