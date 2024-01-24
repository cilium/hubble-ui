package e2e

import (
	"time"

	"github.com/cilium/hubble-ui/backend/internal/mock/factories"
	"github.com/cilium/hubble-ui/backend/internal/mock/sources"
	ns_common "github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"

	"github.com/cilium/hubble-ui/backend/domain/events"
	"github.com/cilium/hubble-ui/backend/pkg/rate_limiter"
)

func (tc *TestsController) enableTenantJobsCase(_ts *TestSettings) error {
	flowsLogFile, fgsLogFile, err := tc.openLogFiles("/tenant-jobs")
	if err != nil {
		return err
	}

	nsSource := sources.Namespaces([]*ns_common.NSEvent{
		factories.CreateNSEvent(events.Added, "tenant-jobs"),
		factories.CreateNSEvent(events.Added, "tenant-jobs"),
	})

	flowsSource := sources.LogFile(
		flowsLogFile,
		tc.log.WithField("source", "tenant-jobs-flows"),
		sources.LogFileSourceOpts{},
	)
	fgsSource := sources.LogFile(
		fgsLogFile,
		tc.log.WithField("source", "tenant-jobs-fgs"),
		sources.LogFileSourceOpts{},
	)

	combined := sources.Combine(nsSource, flowsSource, fgsSource)
	tc.clients.SetSource(combined)

	flowsRateLimit := rate_limiter.RateLimit{
		Limit:  100,
		Period: 5 * time.Second,
	}
	tc.clients.SetFlowsRateLimit(flowsRateLimit)

	return nil
}
