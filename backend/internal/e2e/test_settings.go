package e2e

import (
	"strings"

	"github.com/sirupsen/logrus"
)

type TestPreset string

const (
	NoPreset           TestPreset = ""
	TenantJobs         TestPreset = "tenant-jobs"
	NamespaceListCheck TestPreset = "ns-list-check"
)

type TestSettings struct {
	Preset TestPreset
}

func (ts *TestSettings) IsTenantJobs() bool {
	return ts.Preset == TenantJobs
}

func (ts *TestSettings) FillFromParamString(p string) {
	params := strings.Split(p, ",")

	for _, param := range params {
		k, v := ts.parseInnerParam(param)

		if k == "preset" {
			ts.Preset = TestPreset(v)
		}
	}
}

func (ts *TestSettings) parseInnerParam(p string) (string, string) {
	parts := strings.SplitN(p, "=", 2)
	if len(parts) == 0 {
		return "", ""
	}

	if len(parts) == 1 {
		return parts[0], ""
	}

	key := parts[0]
	value := strings.Join(parts[1:], "=")

	return key, value
}

func (ts *TestSettings) LogFields() logrus.Fields {
	return logrus.Fields{
		"preset": ts.Preset,
	}
}
