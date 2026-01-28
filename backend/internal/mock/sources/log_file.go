package sources

import (
	"context"
	"log/slog"

	"github.com/cilium/cilium/api/v1/observer"

	"github.com/cilium/hubble-ui/backend/internal/events_log_file"
	"github.com/cilium/hubble-ui/backend/internal/log_file"
	"github.com/cilium/hubble-ui/backend/pkg/rate_limiter"
)

type LogFileSource struct {
	emptySource

	lf   *log_file.LogFile
	log  *slog.Logger
	opts LogFileSourceOpts

	flowsCh FlowsChannel
}

type LogFileSourceOpts struct {
	FlowsRateLimit rate_limiter.RateLimit
	DebugHandler   func(int, *events_log_file.EventEntry)
}

func LogFile(
	lf *log_file.LogFile,
	log *slog.Logger,
	opts LogFileSourceOpts,
) *LogFileSource {
	return &LogFileSource{
		emptySource: newEmpty(),
		lf:          lf,
		log:         log,
		opts:        opts,
		flowsCh:     make(FlowsChannel),
	}
}

func (lfs *LogFileSource) Duplicate() MockedSource {
	return LogFile(lfs.lf, lfs.log, lfs.opts)
}

func (lfs *LogFileSource) Flows() FlowsChannel {
	return lfs.flowsCh
}

func (lfs *LogFileSource) Run(ctx context.Context) {
	_it, err := lfs.lf.JsonIterator()
	if err != nil {
		panic("failed to create an iterator over log file: " + err.Error())
	}

	nEntries := 0
	nFlows := 0
	nProcEvents := 0
	nUnparsed := 0

	it := events_log_file.NewEventsIterator(_it)
	flowsRateLimiter := rate_limiter.New(lfs.opts.FlowsRateLimit)

	lfs.log.Info("flows rate limited",
		"limit", lfs.opts.FlowsRateLimit.Limit,
		"period", lfs.opts.FlowsRateLimit.Period)

	for it.HasNext() {
		entry := it.Next()
		nEntries += 1

		if entry.Flow != nil {
			nFlows += 1

			if err := flowsRateLimiter.Wait(ctx); err != nil {
				lfs.log.Error("flowsRateLimiter.Wait() error", "error", err)
				return
			}

			if err := lfs.sendFlow(ctx, entry.Flow); err != nil {
				lfs.log.Error("sendFlow error", "error", err)
				return
			}
		}

		if lfs.opts.DebugHandler != nil {
			lfs.opts.DebugHandler(nEntries-1, entry)
		}
	}

	lfs.log.Info("log file source is exhausted",
		"nentries", nEntries,
		"nflows", nFlows,
		"nprocevents", nProcEvents,
		"nunparsed", nUnparsed)
}

func (lfs *LogFileSource) sendFlow(ctx context.Context, flow *observer.GetFlowsResponse) error {
	f := flow.GetFlow()
	if f == nil {
		return nil
	}

	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-lfs.Stopped():
	case lfs.flowsCh <- f:
	}

	return nil
}
