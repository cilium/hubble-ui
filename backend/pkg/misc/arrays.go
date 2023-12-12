package misc

func ArrayEquals[T any](a, b []T, cmp func(l, r T) bool) bool {
	if len(a) != len(b) {
		return false
	}

	for i, v := range a {
		if !cmp(v, b[i]) {
			return false
		}
	}

	return true
}
