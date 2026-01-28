package e2e

import (
	"context"
	"log/slog"
	"net/http"
	"path/filepath"

	"github.com/cilium/hubble-ui/backend/internal/api_clients"
	"github.com/cilium/hubble-ui/backend/internal/log_file"

	mclients "github.com/cilium/hubble-ui/backend/internal/mock/clients"
)

type TestsController struct {
	log *slog.Logger

	clients *mclients.Clients

	// NOTE: We need to have a way to intercept all the requests to backend
	// to properly alter the state of mocked entities
	apiserverHttpHandler http.Handler
	logFilesPath         string
}

func NewTestsController(
	ctx context.Context,
	log *slog.Logger,
	logFilesPath string,
) *TestsController {
	if len(logFilesPath) == 0 {
		log.Warn("path to log files is empty, data streams will be empty")
	}

	return &TestsController{
		log:          log,
		clients:      mclients.NewInner(ctx, log.With(slog.String("component", "mock.Clients"))),
		logFilesPath: logFilesPath,
	}
}

func (tc *TestsController) GetClients() api_clients.APIClientsInterface {
	return tc.clients
}

func (tc *TestsController) HandlerMiddleware(next http.Handler) http.Handler {
	tc.apiserverHttpHandler = next
	return tc
}

func (tc *TestsController) LogAttrs() []any {
	return []any{slog.String("log-files-path", tc.logFilesPath)}
}

func (tc *TestsController) applyTestSettings(ts *TestSettings) {
	var err error

	switch ts.Preset {
	case NamespaceListCheck:
		tc.enableNamespaceListCheckCase(ts)
	case TenantJobs:
		err = tc.enableTenantJobsCase(ts)
	case PartiallyDropped:
		err = tc.enablePartiallyDroppedCase()
	}

	if err != nil {
		tc.log.Error("failed to enable test case by preset",
			"error", err,
			"preset", ts.Preset)
	}
}

func (tc *TestsController) openLogFiles(pathPart string) (
	*log_file.LogFile, *log_file.LogFile, error,
) {
	flowsLogFile, err := tc.openLogFile(pathPart, "hubble-events.json.log")
	if err != nil {
		return nil, nil, err
	}

	eventsLogFile, err := tc.openLogFile(pathPart, "fgs-events.json.log")
	if err != nil {
		return nil, nil, err
	}

	return flowsLogFile, eventsLogFile, nil
}

func (tc *TestsController) openLogFile(pathParts ...string) (*log_file.LogFile, error) {
	pathParts = append([]string{tc.logFilesPath}, pathParts...)
	fpath := filepath.Join(pathParts...)

	logFile, err := log_file.OpenLogFile(fpath)
	if err != nil {
		tc.log.Error("failed to open log file",
			"error", err,
			"path", fpath)

		return nil, err
	}

	return logFile, nil
}
