package delays

import (
	"fmt"
	"math"
)

// NOTE: d(x) = a + b * exp(-steep * x)
type NegativeExponential struct {
	a     float64
	b     float64
	steep float64
}

// NOTE: Bigger steep leads to faster descent
func NewNegativeExponential(min, max, steep float64) (*NegativeExponential, error) {
	if tooSmall(steep) {
		return nil, fmt.Errorf(
			"cannot build NegativeExponential: steep parameter cannot be zero",
		)
	}

	powerOfE := math.Exp(steep)
	denom := (1 - powerOfE) / powerOfE

	b := (min - max) / denom
	a := (max/powerOfE - min) / denom

	return &NegativeExponential{
		a:     a,
		b:     b,
		steep: steep,
	}, nil
}

func (ne *NegativeExponential) Calc(x float64) float64 {
	return ne.a + ne.b*math.Exp(-ne.steep*x)
}

func (ne *NegativeExponential) Invert(y float64) float64 {
	return -1 / ne.steep * math.Log((y-ne.a)/ne.b)
}

func tooSmall(v float64) bool {
	return math.Abs(v) < 1e-9
}

// NOTE: Consider using this Gnuplot file to understand how steep works:
//
// Min = 0.5
// Max = 3.0
// E = exp(1)
//
// D(k) = (1 - E**k)/E**k
// A(k) = (Max/(E**k) - Min)/D(k)
// B(k) = (Min - Max)/D(k)
//
// iexp(k, x)=A(k)+B(k)*exp(-k*x)
// lin(x) = (Min-Max)*x + Max
//
// set yrange [Min-1:Max+1]
// set xrange [-0.5:2]
//
// plot Min, Max, lin(x), iexp(1, x), iexp(1.5, x), iexp(2, x), iexp(2.5, x)
