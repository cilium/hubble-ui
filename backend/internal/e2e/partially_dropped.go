package e2e

import (
	"time"

	"github.com/cilium/hubble-ui/backend/domain/events"
	"github.com/cilium/hubble-ui/backend/internal/events_log_file"
	"github.com/cilium/hubble-ui/backend/internal/mock/factories"
	"github.com/cilium/hubble-ui/backend/internal/mock/sources"
	ns_common "github.com/cilium/hubble-ui/backend/internal/ns_watcher/common"
	"github.com/cilium/hubble-ui/backend/pkg/rate_limiter"
)

func (tc *TestsController) enablePartiallyDroppedCase() error {
	flowsLogFile, err := tc.openLogFile("/flows/forwarded-and-dropped-2.json")
	if err != nil {
		return err
	}

	nsSource := sources.Namespaces([]*ns_common.NSEvent{
		factories.CreateNSEvent(events.Added, "default"),
		factories.CreateNSEvent(events.Added, "default"),
	})

	flowsSource := sources.LogFile(
		flowsLogFile,
		tc.log.WithField("source", "FnD-flows"),
		sources.LogFileSourceOpts{
			DebugHandler: func(i int, e *events_log_file.EventEntry) {
				if e == nil {
					return
				}

				tc.log.
					WithField("index", i).
					WithFields(e.LogEntries()).
					Debug("unparsed entry")
			},
		},
	)

	combined := sources.Combine(nsSource, flowsSource)
	tc.clients.SetSource(combined)

	flowsRateLimit := rate_limiter.RateLimit{
		Limit:  100,
		Period: 5 * time.Second,
	}
	tc.clients.SetFlowsRateLimit(flowsRateLimit)

	return nil
}
