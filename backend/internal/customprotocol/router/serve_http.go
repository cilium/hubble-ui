package router

import (
	"context"
	"net/http"

	"github.com/pkg/errors"
)

// NOTE: When you got a request here, there are two options. The first is that
// route is oneshot, so after response the channel will be closed, so no async
// code is running here. The second is that it is stream route. In this case,
// the context you can get via req.Context() is only valid until either the
// first response from this stream route or until user breaks the connection.
// But in the same time, we must obey `r.baseContext`, since it is the only way
// to know that server is shutting down. The thing is that since it is a stream
// route we would like to have some code running constantly (maybe it is an
// infinite loop or smth like that) Therefore, we are going to call stream
// handler once (on first incoming message) and try to resume it by special
// handle in future (on further messages).

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	msg, isJSON, err := r.parseHTTPRequest(req)
	if err != nil {
		r.log.WithError(err).Error("failed to extract customprotocol.Request")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// NOTE: If this is not the first request/response in a row, existing
	// traceId will be preserved
	if err := r.fallbackChannelAndTraceIds(msg); err != nil {
		r.log.WithError(err).Error("failed to fallback ChannelId/TraceId")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log := r.log.WithFields(msg.LogFields())

	// NOTE: Careful, all those shared methods should be thread safe
	route := r.matchRoute(msg)
	if route == nil {
		log.Warn("requested route not found")
		w.WriteHeader(http.StatusNotFound)
		return
	}

	ctx := req.Context()
	// NOTE: Resume will either revive the stream or initiate oneshot response
	responseMessage, err := route.Poll(ctx, msg)
	defer r.runGarbageCollector()

	if err == nil || errors.Is(err, context.DeadlineExceeded) {
		log := r.log.WithFields(responseMessage.LogFields()).WithField("isJSON", isJSON)
		if responseMessage.IsError() {
			log.Warn("responding with errors")
		}

		err = r.respondWithMessage(w, isJSON, responseMessage)
		if err != nil {
			log.WithError(err).Error("failed to serialize the response")
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		return
	}

	if errors.Is(err, context.Canceled) {
		log.
			WithError(err).
			Warn("poll request cancelled: connection timeout or server shutdown")
		return
	} else {
		log.WithError(err).Error("route.Resume failed")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
