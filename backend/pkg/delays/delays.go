package delays

type SmoothNormalizedFn interface {
	Calc(t float64) float64
	Invert(y float64) float64
}
