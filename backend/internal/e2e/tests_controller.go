package e2e

import (
	"context"
	"net/http"
	"path/filepath"

	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/api_clients"
	"github.com/cilium/hubble-ui/backend/internal/log_file"

	mclients "github.com/cilium/hubble-ui/backend/internal/mock/clients"
)

type TestsController struct {
	log logrus.FieldLogger

	clients *mclients.Clients

	// NOTE: We need to have a way to intercept all the requests to backend
	// to properly alter the state of mocked entities
	apiserverHttpHandler http.Handler
	logFilesPath         string
}

func NewTestsController(
	ctx context.Context,
	log logrus.FieldLogger,
	logFilesPath string,
) *TestsController {
	if len(logFilesPath) == 0 {
		log.Warn("path to log files is empty, data streams will be empty")
	}

	return &TestsController{
		log:          log,
		clients:      mclients.NewInner(ctx, log.WithField("component", "mock.Clients")),
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

func (tc *TestsController) LogFields() logrus.Fields {
	return logrus.Fields{
		"log-files-path": tc.logFilesPath,
	}
}

func (tc *TestsController) applyTestSettings(ts *TestSettings) {
	switch ts.Preset {
	case NamespaceListCheck:
		tc.enableNamespaceListCheckCase(ts)
	case TenantJobs:
		if err := tc.enableTenantJobsCase(ts); err != nil {
			tc.log.WithError(err).Error("failed to enable tenant jobs case")
		}
	}
}

func (tc *TestsController) openLogFiles(pathPart string) (
	*log_file.LogFile, *log_file.LogFile, error,
) {
	flowsPath := filepath.Join(tc.logFilesPath, pathPart, "hubble-events.json.log")
	flowsLogFile, err := log_file.OpenLogFile(flowsPath)
	if err != nil {
		tc.log.
			WithError(err).
			WithField("path", flowsPath).
			Error("failed to open flows log file")

		return nil, nil, err
	}

	eventsPath := filepath.Join(tc.logFilesPath, pathPart, "fgs-events.json.log")
	eventsLogFile, err := log_file.OpenLogFile(eventsPath)
	if err != nil {
		tc.log.
			WithError(err).
			WithField("path", eventsPath).
			Error("failed to open fgs events log file")

		return nil, nil, err
	}

	return flowsLogFile, eventsLogFile, nil
}
