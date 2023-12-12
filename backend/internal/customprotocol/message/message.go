package message

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	protobuf "google.golang.org/protobuf/proto"

	cerrors "github.com/cilium/hubble-ui/backend/internal/customprotocol/errors"
	cppb "github.com/cilium/hubble-ui/backend/proto/customprotocol"
)

type MessageBody []byte

type Message struct {
	Proto                *cppb.Message
	HttpRequest          *http.Request
	IsOpening            bool
	ResponseStatusHeader int
	ResponseHeaders      http.Header
	ResponseCookies      []*http.Cookie
}

// NOTE: It should be ok to pass nil as req pointer
func NewFromProto(p *cppb.Message, req *http.Request) *Message {
	msg := &Message{
		Proto:                p,
		HttpRequest:          req,
		ResponseStatusHeader: http.StatusOK,
		ResponseHeaders:      make(http.Header),
		ResponseCookies:      make([]*http.Cookie, 0),
	}

	if msg.Proto.GetMeta() == nil {
		msg.Proto.Meta = &cppb.Meta{}
	}

	if msg.Proto.GetBody() == nil {
		msg.Proto.Body = &cppb.Body{}
	}

	return msg
}

func (m *Message) SetAsOpening(isOpening bool) *Message {
	m.IsOpening = isOpening
	return m
}

func (m *Message) RequestHeaders() (http.Header, bool) {
	if m.HttpRequest == nil {
		return make(http.Header), false
	}

	return m.HttpRequest.Header, true
}

func (m *Message) RequestCookie(name string) *http.Cookie {
	if m.HttpRequest == nil {
		return nil
	}

	name = strings.ToLower(name)

	for _, cookie := range m.HttpRequest.Cookies() {
		if strings.ToLower(cookie.Name) == name {
			return cookie
		}
	}

	return nil
}

func (m *Message) AddResponseCookie(cookie *http.Cookie) {
	m.ResponseCookies = append(m.ResponseCookies, cookie)
}

func (m *Message) SetStatusHeader(code int) {
	m.ResponseStatusHeader = code
}

func (m *Message) SetChannelId(cid string) string {
	current := m.ChannelId()
	m.Proto.Meta.ChannelId = cid

	return current
}

func (m *Message) SetFallbackTraceId(tid string) string {
	current := m.TraceId()
	if len(current) > 0 {
		return current
	}

	m.Proto.Meta.TraceId = tid
	return tid
}

func (m *Message) SetTraceId(tid string) string {
	old := m.TraceId()
	m.Proto.Meta.TraceId = tid

	return old
}

func (m *Message) Serialize(asJSON bool) ([]byte, error) {
	if asJSON {
		return json.Marshal(m.Proto)
	}

	return protobuf.Marshal(m.Proto)
}

func (m *Message) DeserializeProtoBody(dst protobuf.Message) error {
	return protobuf.Unmarshal(m.BodyBytes(), dst)
}

func (m *Message) LogFields() logrus.Fields {
	return logrus.Fields{
		"traceId":                 m.TraceId(),
		"routeName":               m.RouteName(),
		"channelId":               m.ChannelId(),
		"bodySize":                len(m.BodyBytes()),
		"isTerminated":            m.IsTerminated(),
		"isNotReady":              m.IsNotReady(),
		"isError":                 m.IsError(),
		"errors":                  m.Errors(),
		"lastDatumId":             m.LastDatumId(),
		"nextDatumId":             m.NextDatumId(),
		"size-of-responseCookies": len(m.ResponseCookies),
		"responseStatusHeader":    m.ResponseStatusHeader,
	}
}

func (m *Message) BodyBytes() MessageBody {
	return m.Proto.GetBody().GetContent()
}

func (m *Message) RouteName() string {
	return m.Proto.GetMeta().GetRouteName()
}

func (m *Message) TraceId() string {
	return m.Proto.GetMeta().GetTraceId()
}

func (m *Message) ChannelId() string {
	return m.Proto.GetMeta().GetChannelId()
}

func (m *Message) LastDatumId() string {
	return m.Proto.GetMeta().GetLastDatumId()
}

func (m *Message) NextDatumId() string {
	return m.Proto.GetMeta().GetNextDatumId()
}

func (m *Message) IsTerminated() bool {
	return m.Proto.GetMeta().GetIsTerminated()
}

func (m *Message) IsNotReady() bool {
	return m.Proto.GetMeta().GetIsNotReady()
}

func (m *Message) IsPoll() bool {
	return m.IsNotReady()
}

func (m *Message) IsEmpty() bool {
	return m.Proto.GetMeta().GetIsEmpty()
}

func (m *Message) PollDelayMs() uint64 {
	return m.Proto.GetMeta().GetPollDelayMs()
}

func (m *Message) PollDelay() time.Duration {
	return time.Duration(m.PollDelayMs()) * time.Millisecond
}

func (m *Message) IsError() bool {
	return m.Proto.GetMeta().GetIsError()
}

func (m *Message) IsFinalized() bool {
	return m.IsEmpty() && m.IsTerminated()
}

func (m *Message) ErrorMessages() []string {
	terrs := make([]string, len(m.Proto.GetMeta().GetErrors()))

	for idx, err := range m.Proto.GetMeta().GetErrors() {
		terrs[idx] = err.GetMessage()
	}

	return terrs
}

func (m *Message) Errors() []error {
	errs := make([]error, len(m.Proto.GetMeta().GetErrors()))

	for idx, err := range m.Proto.GetMeta().GetErrors() {
		errs[idx] = cerrors.ToError(err)
	}

	return errs
}

func (m *Message) ErrorMessage() string {
	return strings.Join(m.ErrorMessages(), ", ")
}

func (m *Message) FirstErrorMessage() string {
	errs := m.ErrorMessages()
	if len(errs) == 0 {
		return ""
	}

	return errs[0]
}
