package misc

func MapArray[T, U any](data []T, f func(int, T) U) []U {
	res := make([]U, 0, len(data))

	for i, e := range data {
		res = append(res, f(i, e))
	}

	return res
}
