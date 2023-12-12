package e2e

import (
	"github.com/cilium/hubble-ui/backend/domain/events"
	"github.com/cilium/hubble-ui/backend/internal/mock/factories"
	"github.com/cilium/hubble-ui/backend/internal/mock/sources"
	ns_common "github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
)

func (tc *TestsController) enableNamespaceListCheckCase(ts *TestSettings) error {
	nsSource := sources.Namespaces([]*ns_common.NSEvent{
		factories.CreateNSEvent(events.Added, "ns-relay"),
	})

	tc.clients.SetSource(nsSource)
	return nil
}
