package logger

import (
	"fmt"

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
	subsys := fmt.Sprintf("ui-backend:%s", submodule)

	return CiliumDefaultLogger.WithField(logfields.LogSubsys, subsys)
}
