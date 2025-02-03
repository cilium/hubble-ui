package logger

import (
	"github.com/sirupsen/logrus"

	"github.com/cilium/cilium/pkg/logging"
	"github.com/cilium/cilium/pkg/logging/logfields"
)

var (
	CiliumDefaultLogger = logging.DefaultLogger
	DefaultLogger       = New("ui-backend")
)

func New(module string) *logrus.Entry {
	return CiliumDefaultLogger.WithField(logfields.LogSubsys, module)
}

func Sub(submodule string) *logrus.Entry {
	subsys := "ui-backend:" + submodule

	return CiliumDefaultLogger.WithField(logfields.LogSubsys, subsys)
}
