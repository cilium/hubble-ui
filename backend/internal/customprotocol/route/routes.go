package route

type Routes map[string]*Route

func (rs Routes) Get(k string) *Route {
	r := rs[k]
	return r
}
