package config

import (
	"fmt"
	"strings"

	"github.com/pkg/errors"
)

func (b *ConfigBuilder) separatedStringList(str string, sep string) []string {
	list := make([]string, 0)

	for _, part := range strings.Split(str, sep) {
		trimmed := strings.TrimSpace(part)
		if len(trimmed) == 0 {
			continue
		}

		list = append(list, trimmed)
	}

	return list
}

func (b *ConfigBuilder) err(what string) error {
	return errors.New(
		fmt.Sprintf("failed to build Config: %s is not set", what),
	)
}
