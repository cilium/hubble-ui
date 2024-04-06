package set

import (
	"fmt"
	"strings"
)

type Set[T comparable] map[T]struct{}

func (s Set[T]) Add(values ...T) {
	for _, v := range values {
		s[v] = struct{}{}
	}
}

func (s Set[T]) Join(sep string) string {
	sb := strings.Builder{}
	i := 0

	for v := range s {
		if i == 0 {
			fmt.Fprintf(&sb, "%v", v)
		} else {
			fmt.Fprintf(&sb, ",%v", v)
		}

		i += 1
	}

	return sb.String()
}

func (s Set[T]) CopyFrom(rhs Set[T]) {
	for v := range rhs {
		s[v] = struct{}{}
	}
}
