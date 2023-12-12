package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
)

type PropGetters struct {
	GopsEnabled              EnvVarGetter[bool]
	GopsPort                 EnvVarGetter[uint16]
	CorsEnabled              EnvVarGetter[bool]
	DebugLogs                EnvVarGetter[bool]
	RelayAddr                EnvVarGetter[string]
	UIServerPort             EnvVarGetter[uint16]
	TLSToRelayEnabled        EnvVarGetter[bool]
	TLSToRelayServerName     EnvVarGetter[string]
	TLSToRelayCACertFiles    EnvVarGetter[string]
	TLSToRelayClientCertFile EnvVarGetter[string]
	TLSToRelayClientKeyFile  EnvVarGetter[string]
	ClientPollDelays         []time.Duration
	E2ETestModeEnabled       EnvVarGetter[bool]
	E2ELogfilesBasepath      EnvVarGetter[string]
}

type EnvVarGetter[T any] func() EnvVarResult[T]

type EnvVarResult[T any] struct {
	IsRequired  bool
	IsPresented bool
	VarName     string
	Value       T
	ParseErr    error
}

func Bool(envName string) EnvVarGetter[bool] {
	return func() EnvVarResult[bool] {
		val, ok := os.LookupEnv(envName)
		boolValue, err := strconv.ParseBool(val)

		return EnvVarResult[bool]{
			IsRequired:  true,
			IsPresented: ok,
			VarName:     envName,
			Value:       boolValue,
			ParseErr:    err,
		}
	}
}

func BoolOr(envName string, def bool) EnvVarGetter[bool] {
	return func() EnvVarResult[bool] {
		val, ok := os.LookupEnv(envName)
		boolValue := def
		var err error

		if ok {
			parsed, _err := strconv.ParseBool(val)
			if _err == nil {
				boolValue = parsed
			} else {
				err = _err
			}
		}

		return EnvVarResult[bool]{
			IsRequired:  false,
			IsPresented: ok,
			VarName:     envName,
			Value:       boolValue,
			ParseErr:    err,
		}
	}
}

func Uint16Or(envName string, def uint16) EnvVarGetter[uint16] {
	return func() EnvVarResult[uint16] {
		val, ok := os.LookupEnv(envName)
		intValue := def
		var err error

		if ok {
			parsed, _err := strconv.ParseUint(val, 10, 16)
			if _err == nil {
				intValue = uint16(parsed)
			} else {
				err = _err
			}
		}

		return EnvVarResult[uint16]{
			IsRequired:  false,
			IsPresented: ok,
			VarName:     envName,
			Value:       intValue,
			ParseErr:    err,
		}
	}
}

func StrOr(envName string, def string) EnvVarGetter[string] {
	return func() EnvVarResult[string] {
		val, ok := os.LookupEnv(envName)
		if !ok {
			val = def
		}

		return EnvVarResult[string]{
			IsRequired:  false,
			IsPresented: ok,
			VarName:     envName,
			Value:       val,
			ParseErr:    nil,
		}
	}
}

func Str(envName string) EnvVarGetter[string] {
	return func() EnvVarResult[string] {
		val, ok := os.LookupEnv(envName)

		return EnvVarResult[string]{
			IsRequired:  true,
			IsPresented: ok,
			VarName:     envName,
			Value:       val,
			ParseErr:    nil,
		}
	}
}

func DurationOr(envName string, def time.Duration) EnvVarGetter[time.Duration] {
	return func() EnvVarResult[time.Duration] {
		raw, ok := os.LookupEnv(envName)
		val := def
		var err error

		if ok {
			parsed, _err := time.ParseDuration(raw)
			if _err == nil {
				val = parsed
			} else {
				err = _err
			}
		}

		return EnvVarResult[time.Duration]{
			IsRequired:  false,
			IsPresented: ok,
			VarName:     envName,
			Value:       val,
			ParseErr:    err,
		}
	}
}

func (er *EnvVarResult[T]) Err() error {
	if er.ParseErr != nil {
		return fmt.Errorf(
			"failed to parse env var '%s' value: %s",
			er.VarName,
			er.ParseErr.Error(),
		)
	}

	if !er.IsRequired || er.IsPresented {
		return nil
	}

	return fmt.Errorf("env var '%s' is required, but is not set", er.VarName)
}

func (er *EnvVarResult[T]) LogIfFallback(log logrus.FieldLogger) {
	if er.IsRequired || er.IsPresented {
		return
	}

	log.
		WithField("var", er.VarName).
		WithField("fallback", fmt.Sprintf("%v", er.Value)).
		Warn("using fallback value for env var")
}
