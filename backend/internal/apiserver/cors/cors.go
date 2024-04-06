package cors

import (
	"net/http"
	"strings"

	"github.com/cilium/hubble-ui/backend/pkg/set"
)

type CORSServer struct {
	wrapped http.Handler
	opts    Options
}

type Options struct {
	Origin string
}

func WrapHandler(h http.Handler, opts Options) *CORSServer {
	srv := CORSServer{
		wrapped: h,
		opts:    opts,
	}

	return &srv
}

func (cs *CORSServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	cs.WriteControlHeaders(w, r)
	cs.wrapped.ServeHTTP(w, r)
}

func (cs *CORSServer) HandlePreflight(w http.ResponseWriter, r *http.Request) {
	cs.WriteControlHeaders(w, r)
	w.WriteHeader(http.StatusNoContent)
}

func (cs *CORSServer) WriteControlHeaders(w http.ResponseWriter, r *http.Request) {
	header := w.Header()
	header.Set("Access-Control-Allow-Origin", cs.getOrigin(w, r))
	header.Set("Access-Control-Allow-Methods", cs.getAllowMethods(w, r))
	header.Set("Access-Control-Allow-Credentials", "true")

	allowHeaders := cs.getAllowHeaders(w, r)
	if len(allowHeaders) > 0 {
		header.Set("Access-Control-Allow-Headers", allowHeaders)
	}
}

func (cs *CORSServer) getAllowMethods(w http.ResponseWriter, r *http.Request) string {
	requested := r.Header.Get("Access-Control-Request-Method")
	s := cs.makeSetFromHeaderValues(requested)

	// NOTE: Response headers seem to be prefilled by httprouter with that
	allowHeader := w.Header().Get("Allow")
	s.CopyFrom(cs.makeSetFromHeaderValues(allowHeader))

	s.Add("OPTIONS")
	return s.Join(",")
}

func (cs *CORSServer) getAllowHeaders(_ http.ResponseWriter, r *http.Request) string {
	requested := r.Header.Get("Access-Control-Request-Headers")

	s := cs.makeSetFromHeaderValues(requested)
	s.Add("content-type", "content-length")

	return s.Join(",")
}

func (cs *CORSServer) getOrigin(_ http.ResponseWriter, r *http.Request) string {
	if len(cs.opts.Origin) > 0 {
		return cs.opts.Origin
	}

	requesterOrigin := r.Header.Get("Origin")
	if len(requesterOrigin) > 0 {
		return requesterOrigin
	}

	// NOTE: It will not work in Chrome
	return "*"
}

func (cs *CORSServer) makeSetFromHeaderValues(v string) set.Set[string] {
	s := set.Set[string]{}

	for _, p := range strings.Split(v, ",") {
		p = strings.TrimSpace(p)
		if len(p) == 0 {
			continue
		}

		s.Add(p)
	}

	return s
}
