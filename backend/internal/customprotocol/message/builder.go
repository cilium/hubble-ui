package message

import (
	"fmt"
	"net/http"
	"time"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/errors"
	cppb "github.com/cilium/hubble-ui/backend/proto/customprotocol"
)

type MessageBuilder struct {
	p               *cppb.Message
	code            *int
	httpRequest     *http.Request
	responseCookies []*http.Cookie
}

func Builder() MessageBuilder {
	return MessageBuilder{
		p: &cppb.Message{
			Meta: &cppb.Meta{},
			Body: &cppb.Body{},
		},
		code:            nil,
		httpRequest:     nil,
		responseCookies: []*http.Cookie{},
	}
}

func (b MessageBuilder) WithTraceId(tid string) MessageBuilder {
	b.p.Meta.TraceId = tid
	return b
}

func (b MessageBuilder) WithChannelId(cid string) MessageBuilder {
	b.p.Meta.ChannelId = cid
	return b
}

func (b MessageBuilder) WithRouteName(r string) MessageBuilder {
	b.p.Meta.RouteName = r
	return b
}

func (b MessageBuilder) WithHTTPRequest(req *http.Request) MessageBuilder {
	b.httpRequest = req
	return b
}

func (b MessageBuilder) WithLastDatumId(did string) MessageBuilder {
	b.p.Meta.LastDatumId = did
	return b
}

func (b MessageBuilder) WithNextDatumId(did string) MessageBuilder {
	b.p.Meta.NextDatumId = did
	return b
}

func (b MessageBuilder) WithTerminated(t bool) MessageBuilder {
	b.p.Meta.IsTerminated = t
	return b
}

func (b MessageBuilder) WithNotReady(nr bool) MessageBuilder {
	b.p.Meta.IsNotReady = nr
	return b
}

func (b MessageBuilder) WithPollDelay(d time.Duration) MessageBuilder {
	b.p.Meta.PollDelayMs = uint64(d.Milliseconds())
	return b
}

func (b MessageBuilder) WithStatusCode(code int) MessageBuilder {
	b.code = &code
	return b
}

func (b MessageBuilder) WithStatusCodePtr(code *int) MessageBuilder {
	b.code = code
	return b
}

func (b MessageBuilder) WithEmpty(isEmpty bool) MessageBuilder {
	b.p.Meta.IsEmpty = isEmpty
	return b
}

func (b MessageBuilder) WithError(err error) MessageBuilder {
	if err == nil {
		return b
	}

	b.p.Meta.IsError = true
	b.p.Meta.Errors = append(b.p.GetMeta().GetErrors(), errors.FromError(err))

	return b
}

func (b MessageBuilder) WithBodyBytes(bb []byte) MessageBuilder {
	b.p.Body.Content = bb
	return b
}

func (b MessageBuilder) WithResponseCookie(cookie *http.Cookie) MessageBuilder {
	b.responseCookies = append(b.responseCookies, cookie)
	return b
}

func (b MessageBuilder) WithResponseCookies(cookies []*http.Cookie) MessageBuilder {
	b.responseCookies = append(b.responseCookies, cookies...)
	return b
}

func (b MessageBuilder) IsTerminated() bool {
	return b.p.GetMeta().GetIsTerminated()
}

func (b MessageBuilder) IsPoll() bool {
	return b.p.GetMeta().GetIsNotReady()
}

func (b MessageBuilder) Errors() []*cppb.Error {
	return b.p.GetMeta().GetErrors()
}

func (b MessageBuilder) StatusCode() *int {
	return b.code
}

func (b MessageBuilder) Build() (*Message, error) {
	if len(b.p.GetMeta().GetTraceId()) == 0 {
		return nil, b.err("traceId")
	}

	if len(b.p.GetMeta().GetChannelId()) == 0 {
		return nil, b.err("channelId")
	}

	if len(b.p.GetMeta().GetRouteName()) == 0 {
		return nil, b.err("routeName")
	}

	statusHeader := http.StatusOK
	if b.code != nil {
		statusHeader = *b.code
	}

	return &Message{
		Proto:                b.p,
		HttpRequest:          b.httpRequest,
		ResponseStatusHeader: statusHeader,
		ResponseCookies:      b.responseCookies,
	}, nil
}

func (b MessageBuilder) err(what string) error {
	return fmt.Errorf("failed to build Message: %s is not set", what)
}
