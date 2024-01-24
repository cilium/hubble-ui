package router

import (
	"io"
	"net/http"

	"github.com/pkg/errors"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/message"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/route"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/utils"
)

func (r *Router) parseHTTPRequest(req *http.Request) (
	*message.Message, bool, error,
) {
	return r.parseMessageFromRequest(req)
}

func (r *Router) fallbackChannelAndTraceIds(msg *message.Message) error {
	if len(msg.ChannelId()) == 0 {
		cid, err := r.genChannelId()
		if err != nil {
			return errors.Wrapf(err, "failed to generate new ChannelId")
		}

		msg.SetChannelId(cid)
	}

	if len(msg.TraceId()) == 0 {
		traceId, err := r.genTraceId()
		if err != nil {
			return errors.Wrapf(err, "failed to generate new TraceId")
		}

		msg.SetTraceId(traceId)
	}

	return nil
}

func (r *Router) parseMessageFromRequest(req *http.Request) (
	*message.Message, bool, error,
) {
	bytes, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, false, errors.Wrapf(err, "failed to read http request body")
	}

	contentType := req.Header.Get("content-type")
	isJSONMode := contentType == "application/json"

	msg, err := utils.ParseMessageFromBytes(bytes, isJSONMode)
	if msg != nil {
		msg.HttpRequest = req
	}

	if isJSONMode {
		return msg, true, err
	}

	return msg, false, err
}

func (r *Router) matchRoute(msg *message.Message) *route.Route {
	routeName := msg.RouteName()
	route := r.routes.Get(routeName)

	return route
}

func (r *Router) respondWithMessage(
	w http.ResponseWriter,
	inJSON bool,
	msg *message.Message,
) error {
	bytes, err := msg.Serialize(inJSON)
	if err != nil {
		return err
	}

	if inJSON {
		w.Header().Set("content-type", "application/json")
	} else {
		w.Header().Set("content-type", "application/octet-stream")
	}

	utils.CopyHeaders(w.Header(), msg.ResponseHeaders)

	for _, cookie := range msg.ResponseCookies {
		http.SetCookie(w, cookie)
	}

	statusHeader := msg.ResponseStatusHeader
	if statusHeader == 0 {
		statusHeader = http.StatusOK
	} else {
		statusHeader = msg.ResponseStatusHeader
	}

	// NOTE: WriteHeader must be called after all the mutations to headers buf
	w.WriteHeader(statusHeader)

	_, err = w.Write(bytes)
	if err != nil {
		return err
	}

	return nil
}

func (r *Router) genTraceId() (string, error) {
	return utils.GenBytesHash(r.tidBytesNumber)
}

func (r *Router) genChannelId() (string, error) {
	return utils.GenBytesHash(r.cidBytesNumber)
}
