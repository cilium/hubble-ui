package apiserver

import (
	"sync"

	rcontext "github.com/cilium/hubble-ui/backend/internal/apiserver/req_context"
	cp "github.com/cilium/hubble-ui/backend/internal/customprotocol"
)

func (srv *APIServer) loggerMiddleware(handler string) *LoggingMiddleware {
	return &LoggingMiddleware{
		mx:           sync.Mutex{},
		srv:          srv,
		handler:      handler,
		isTerminated: false,
	}
}

type LoggingMiddleware struct {
	mx           sync.Mutex
	srv          *APIServer
	handler      string
	isTerminated bool
}

func (lm *LoggingMiddleware) Clone() cp.ChannelMiddleware {
	return &LoggingMiddleware{
		mx:           sync.Mutex{},
		srv:          lm.srv,
		handler:      lm.handler,
		isTerminated: false,
	}
}

func (lm *LoggingMiddleware) RunBeforePolling(ch *cp.Channel, msg *cp.Message) error {
	lm.mx.Lock()
	defer lm.mx.Unlock()

	if lm.isTerminated {
		return nil
	}

	rctx, err := lm.srv.ensureHandlerData(ch)
	if err != nil {
		return err
	}

	log := lm.srv.log.WithField("channelId", ch.Id)
	if len(lm.handler) > 0 {
		log = log.WithField("handler", lm.handler)
	}

	rctx.SetLogger(log)
	lm.isTerminated = true

	return nil
}

func (srv *APIServer) ensureHandlerData(ch *cp.Channel) (*rcontext.Context, error) {
	h := ch.HandlerData()
	if h == nil {
		rctx := rcontext.New(ch.Context())
		if err := ch.SetHandlerData(rctx); err != nil {
			return nil, err
		}

		return rctx, nil
	}

	rctx, ok := h.(*rcontext.Context)
	if ok {
		return rctx, nil
	}

	rctx = rcontext.New(ch.Context())
	if err := ch.SetHandlerData(rctx); err != nil {
		return nil, err
	}

	return rctx, nil
}
