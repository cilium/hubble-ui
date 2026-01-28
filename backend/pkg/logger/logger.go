package logger

import (
	"log/slog"

	"github.com/cilium/cilium/pkg/logging"
	"github.com/cilium/cilium/pkg/logging/logfields"
)

var (
	DefaultSlogLogger = logging.DefaultSlogLogger
	DefaultLogger     = New("ui-backend")
)

func New(module string) *slog.Logger {
	return DefaultSlogLogger.With(logfields.LogSubsys, module)
}

func Sub(submodule string) *slog.Logger {
	subsys := "ui-backend:" + submodule

	return DefaultSlogLogger.With(logfields.LogSubsys, subsys)
}
