package customprotocol

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/cilium/hubble-ui/backend/internal/customprotocol/channel"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/message"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/router"
	"github.com/cilium/hubble-ui/backend/internal/customprotocol/utils"
)

const (
	RouteOneshotInstantError      = "oneshot_instant_err"
	RouteOneshotDelayedError      = "oneshot_delayed_err"
	RouteOneshotInstantAnswer     = "oneshot_instant_answer"
	RouteOneshotDelayedAnswer     = "oneshot_delayed_answer"
	RouteStreamInstantError       = "stream_instant_err"
	RouteStreamDelayedError       = "stream_delayed_err"
	RouteStreamErrorAfterResponse = "stream_err_after_response"
	RouteStreamFiveNumbers        = "stream_five_numbers"
	RouteStreamInfiniteNumbers    = "stream_infinite_numbers"
	RouteStreamEchoing            = "stream_echoing"
	RouteStreamConstantRate       = "stream_constant_rate"
	RouteStreamSteppedRate        = "stream_stepped_rate"
)

var (
	InstantErrorText       = "instant error text ><"
	DelayedErrorText       = "delayed error text ><"
	ErrorAfterResponseText = "error after response text ><"
)

func TestOneshot(t *testing.T) {
	t.Parallel()
	pollDelay := 30 * time.Millisecond

	runTest(t, "instant error", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: pollDelay,
		},
		RouteName:        RouteOneshotInstantError,
		NumThreads:       10,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						isNotReady:   true,
						isTerminated: true,
						isError:      true,
						isEmpty:      true,
						error:        InstantErrorText,
					},
				},
			},
		},
	})

	runTest(t, "delayed error", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: pollDelay,
		},
		RouteName:        RouteOneshotDelayedError,
		NumThreads:       10,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						isNotReady: true,
						isEmpty:    true,
					},
				},
				waitAfter: 50 * time.Millisecond,
			},
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						isNotReady: true,
						isEmpty:    true,
					},
				},
				waitAfter: 200 * time.Millisecond,
			},
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						isTerminated: true,
						isError:      true,
						isNotReady:   true,
						isEmpty:      true,
						error:        DelayedErrorText,
					},
				},
			},
		},
	})

	runTest(t, "instant answer", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: pollDelay,
		},
		RouteName:        RouteOneshotInstantAnswer,
		NumThreads:       10,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{
					msg: &TestMessage{
						body: "test42",
					},
				},
				response: &TestResponse{
					msg: &TestMessage{
						isNotReady:   false,
						isTerminated: true,
						isEmpty:      true,
						body:         "test42",
					},
				},
			},
		},
	})

	runTest(t, "delayed answer", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: pollDelay,
		},
		RouteName:        RouteOneshotDelayedAnswer,
		NumThreads:       1,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{
					msg: &TestMessage{
						body: "testdelayed",
					},
				},
				response: &TestResponse{
					msg: &TestMessage{
						isNotReady: true,
						isEmpty:    true,
					},
				},
				waitAfter: 250 * time.Millisecond,
			},
			{
				request: &TestRequest{
					msg: &TestMessage{
						body: "thisbodywillbeskipped",
					},
				},
				response: &TestResponse{
					msg: &TestMessage{
						isNotReady:   false,
						isTerminated: true,
						isEmpty:      true,
						body:         "testdelayed",
					},
				},
			},
		},
	})
}

func TestStream(t *testing.T) {
	runTest(t, "instant error", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: 30 * time.Millisecond,
		},
		RouteName:        RouteStreamInstantError,
		NumThreads:       10,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						isTerminated: true,
						isError:      true,
						isNotReady:   true,
						isEmpty:      true,
						error:        InstantErrorText,
					},
				},
			},
		},
	})

	runTest(t, "delayed error", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: 30 * time.Millisecond,
		},
		RouteName:        RouteStreamDelayedError,
		NumThreads:       10,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						isNotReady: true,
						isEmpty:    true,
					},
				},
				waitAfter: 250 * time.Millisecond,
			},
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						isError:      true,
						isTerminated: true,
						isNotReady:   true,
						isEmpty:      true,
						error:        DelayedErrorText,
					},
				},
			},
		},
	})

	runTest(t, "error after response", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: 30 * time.Millisecond,
		},
		RouteName:        RouteStreamErrorAfterResponse,
		NumThreads:       10,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{
					msg: &TestMessage{
						body: "errorafterresponse",
					},
				},
				response: &TestResponse{
					msg: &TestMessage{
						mayBeTerminated: true,
						mayBeEmpty:      true,
						body:            "errorafterresponse",
					},
				},
				waitAfter: 100 * time.Millisecond,
			},
			{
				request: &TestRequest{
					sendIfNotClosed: true,
				},
				response: &TestResponse{
					msg: &TestMessage{
						isError:      true,
						isTerminated: true,
						isNotReady:   true,
						mayBeEmpty:   true,
						error:        ErrorAfterResponseText,
					},
				},
			},
		},
	})

	runTest(t, "five numbers", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: 30 * time.Millisecond,
		},
		RouteName:        RouteStreamFiveNumbers,
		NumThreads:       10,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						body:       "number: 1",
						mayBeEmpty: true,
					},
				},
				waitAfter: 100 * time.Millisecond,
			},
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						body:       "number: 2",
						mayBeEmpty: true,
					},
				},
				waitAfter: 100 * time.Millisecond,
			},
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						body:       "number: 3",
						mayBeEmpty: true,
					},
				},
				waitAfter: 100 * time.Millisecond,
			},
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						body:       "number: 4",
						mayBeEmpty: true,
					},
				},
				waitAfter: 100 * time.Millisecond,
			}, {
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						body:            "number: 5",
						mayBeTerminated: true,
						mayBeEmpty:      true,
					},
				},
			},
		},
	})

	runTest(t, "infinite numbers", &RouterTest{
		RouterInit: RouterInitTest{
			RoutePollDelay: 30 * time.Millisecond,
		},
		RouteName:        RouteStreamInfiniteNumbers,
		NumThreads:       10,
		ThreadStartDelay: 10 * time.Millisecond,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						body:       "number: 1",
						mayBeEmpty: true,
					},
				},
				waitAfter: 100 * time.Millisecond,
			},
			{
				request: &TestRequest{},
				response: &TestResponse{
					msg: &TestMessage{
						body:       "number: 2",
						mayBeEmpty: true,
					},
				},
				waitAfter: 100 * time.Millisecond,
			},
			{
				request: &TestRequest{
					msg: &TestMessage{
						isTerminated: true,
					},
				},
				response: &TestResponse{
					msg: &TestMessage{
						isTerminated: true,
					},
				},
			},
		},
	})
}

func TestPollDelayEchoing(t *testing.T) {
	runTest(t, "poll delay echoing", &RouterTest{
		RouterInit: RouterInitTest{
			MinClientPollDelay: 500 * time.Millisecond,
			MaxClientPollDelay: 3000 * time.Millisecond,
			RoutePollDelay:     0 * time.Millisecond,
		},
		NumThreads:       1,
		ThreadStartDelay: 0,
		RouteName:        RouteStreamEchoing,
		ReqResFn: func(i int, prevResponse *message.Message) (TestReqRes, bool) {
			waitBefore := 500 * time.Millisecond
			if prevResponse != nil {
				waitBefore = prevResponse.PollDelay()
			}

			return TestReqRes{
				request: &TestRequest{
					msg: &TestMessage{},
				},
				response: &TestResponse{
					msg: &TestMessage{
						isMayBeNotReady: true,
						dontCheckBody:   true,
						mayBeEmpty:      true,
					},
				},
				waitBefore: waitBefore,
			}, i == 1
		},
	})
}

func TestPollDelayConstantRate(t *testing.T) {
	runTest(t, "poll delay constant rate", &RouterTest{
		RouterInit: RouterInitTest{
			MinClientPollDelay: 100 * time.Millisecond,
			MaxClientPollDelay: 3000 * time.Millisecond,
			RoutePollDelay:     0 * time.Millisecond,
		},
		NumThreads:       1,
		ThreadStartDelay: 0,
		RouteName:        RouteStreamConstantRate,
		ReqResFn: func(i int, prev *message.Message) (TestReqRes, bool) {
			waitBefore := 100 * time.Millisecond
			if prev != nil {
				waitBefore = prev.PollDelay()
			}

			var pollDelayExpectation []time.Duration = nil
			if i >= 15 {
				pollDelayExpectation = []time.Duration{
					95 * time.Millisecond,
					105 * time.Millisecond,
				}
			}

			return TestReqRes{
				request: &TestRequest{
					msg: &TestMessage{
						body: "100ms",
					},
				},
				response: &TestResponse{
					msg: &TestMessage{
						isMayBeNotReady:        true,
						dontCheckBody:          true,
						clientPollDelayBetween: pollDelayExpectation,
						mayBeEmpty:             true,
					},
				},
				waitBefore: waitBefore,
			}, i >= 15
		},
	})
}

func TestPollDelaySteppedRate(t *testing.T) {
	runTest(t, "poll delay stepped rate", &RouterTest{
		RouterInit: RouterInitTest{
			MinClientPollDelay: 100 * time.Millisecond,
			MaxClientPollDelay: 3000 * time.Millisecond,
			RoutePollDelay:     10 * time.Millisecond,
		},
		NumThreads:       1,
		ThreadStartDelay: 0,
		RouteName:        RouteStreamSteppedRate,
		ReqResFn: func(i int, prev *message.Message) (TestReqRes, bool) {
			waitBefore := 500 * time.Millisecond
			if prev != nil {
				waitBefore = prev.PollDelay()
			}

			pollDelayExpectation := []time.Duration{
				100 * time.Millisecond,
				3000 * time.Millisecond,
			}

			return TestReqRes{
				request: &TestRequest{
					msg: &TestMessage{
						body: "10 10ms 1000 1000ms",
					},
				},
				response: &TestResponse{
					msg: &TestMessage{
						isMayBeNotReady:        true,
						dontCheckBody:          true,
						clientPollDelayBetween: pollDelayExpectation,
						mayBeEmpty:             true,
					},
				},
				waitBefore: waitBefore,
			}, i == 1
		},
	})
}

func TestConsumeHandlerUpdates(t *testing.T) {
	r, _ := createRouter(t, RouterInitTest{
		RoutePollDelay:     10 * time.Millisecond,
		MinClientPollDelay: 100 * time.Millisecond,
		MaxClientPollDelay: 5000 * time.Millisecond,
	})

	type StringAndNum struct {
		String string
		Num    int
	}

	handlerDataArr := []StringAndNum{
		{
			String: "first",
			Num:    0,
		},
		{
			String: "second",
			Num:    1,
		},
		{
			String: "third",
			Num:    2,
		},
	}

	mw := middlewareFn(func(ch *Channel, msg *Message) error {
		current := ch.HandlerData()
		if current == nil {
			if err := ch.SetHandlerData(&handlerDataArr[0]); err != nil {
				return err
			}

			return nil
		}

		d, ok := current.(*StringAndNum)
		if !ok {
			return fmt.Errorf("wrong handler data")
		}

		if d.Num == 2 {
			return nil
		}

		return ch.SetHandlerData(&handlerDataArr[d.Num+1])
	})

	routeName := "handler-data-echo"
	middlewares := []ChannelMiddleware{mw}
	done := make(chan struct{}, 1)

	r.Route(routeName).Middlewares(middlewares).Stream(func(ch *Channel) error {
		defer func() {
			done <- struct{}{}
		}()
		i := 0

		for {
			select {
			case <-ch.Closed():
				return nil
			case <-ch.Shutdown():
				return nil
			case hd := <-ch.HandlerDataUpdated():
				d, ok := hd.(*StringAndNum)
				if !ok {
					return fmt.Errorf("handler data is not a string")
				}

				if d.Num != i {
					return fmt.Errorf("handler data num is %d, expected: %d", d.Num, i)
				}

				if d.Num == 2 {
					return nil
				}

				i += 1
			}
		}
	})

	runTestOnRouter(t, r, "handler data consumption", &RouterTest{
		RouteName:  routeName,
		NumThreads: 1,
		ReqRes: []TestReqRes{
			{
				request: &TestRequest{msg: &TestMessage{}},
				response: &TestResponse{
					msg: &TestMessage{isNotReady: true, isEmpty: true, isTerminated: false},
				},
			},
			{
				request: &TestRequest{msg: &TestMessage{}},
				response: &TestResponse{
					msg: &TestMessage{isNotReady: true, isEmpty: true, isTerminated: false},
				},
			},
			{
				request: &TestRequest{msg: &TestMessage{}},
				response: &TestResponse{
					msg: &TestMessage{isNotReady: true, isEmpty: true, isTerminated: true},
				},
			},
		},
	})
}

func runTest(t *testing.T, testName string, td *RouterTest) {
	r1, _ := createRouter(t, td.RouterInit)
	tn1 := fmt.Sprintf("%s / %s poll delay", testName, td.RouterInit.RoutePollDelay)
	runTestOnRouter(t, r1, tn1, td)
}

func runTestOnRouter(
	t *testing.T,
	r *router.Router,
	testName string,
	td *RouterTest,
) {
	for i := 0; i < td.NumThreads; i++ {
		testName := fmt.Sprintf("%s: worker %d", testName, i)
		t.Run(testName, func(t *testing.T) {
			t.Parallel()

			channelId := ""
			var prevResponse *message.Message = nil

			if td.ReqResFn != nil {
				for i := 0; ; i += 1 {
					reqRes, isLastOne := td.ReqResFn(i, prevResponse)
					prevResponse = runTestReqRes(t, td, r, i, reqRes, &channelId)

					if isLastOne {
						break
					}
				}
			}

			for i, reqRes := range td.ReqRes {
				if prevResponse != nil && prevResponse.IsFinalized() {
					if reqRes.request.sendIfNotClosed {
						continue
					}
				}

				prevResponse = runTestReqRes(t, td, r, i, reqRes, &channelId)
			}
		})

		<-time.After(td.ThreadStartDelay)
	}
}

func runTestReqRes(
	t *testing.T,
	td *RouterTest,
	r *router.Router,
	i int,
	reqRes TestReqRes,
	channelId *string,
) *message.Message {
	req, reqMsg := reqRes.BuildHTTPRequest(t, td.RouteName, *channelId)

	if reqRes.waitBefore != 0 {
		<-time.After(reqRes.waitBefore)
	}

	_, resp, respMsg := feedTestRequest(t, r, req, reqRes.request.isJSON)
	// t.Logf("ClientPollDelay %d: %s\n", i, respMsg.PollDelay())
	reqRes.CheckResponse(t, i, req, reqMsg, resp, respMsg)

	if reqRes.waitAfter != 0 {
		<-time.After(reqRes.waitAfter)
	}

	if i == 0 && len(*channelId) == 0 {
		*channelId = respMsg.ChannelId()
	}

	if err := resp.Body.Close(); err != nil {
		panic("resp.Body.close() error: " + err.Error())
	}

	return respMsg
}

func oneshotInstantError(ch *channel.Channel) error {
	return errors.New(InstantErrorText)
}

func oneshotErrorAfterDelay(ch *channel.Channel) error {
	<-time.After(200 * time.Millisecond)

	return errors.New(DelayedErrorText)
}

func oneshotInstantAnswer(ch *channel.Channel) error {
	msg, err := ch.Receive()
	if err != nil {
		return err
	}

	return ch.Terminate(msg.BodyBytes())
}

func oneshotDelayedAnswer(ch *channel.Channel) error {
	msg, err := ch.Receive()
	if err != nil {
		return err
	}

	<-time.After(200 * time.Millisecond)
	return ch.Terminate(msg.BodyBytes())
}

func streamInstantError(ch *channel.Channel) error {
	return errors.New(InstantErrorText)
}

func streamDelayedError(ch *channel.Channel) error {
	<-time.After(200 * time.Millisecond)
	return errors.New(DelayedErrorText)
}

func streamErrAfterResponse(ch *channel.Channel) error {
	msg, err := ch.ReceiveNonblock()
	if err != nil {
		return err
	}

	if err := ch.SendNonblock(msg.BodyBytes()); err != nil {
		return err
	}

	return errors.New(ErrorAfterResponseText)
}

func streamFiveNumbers(ch *channel.Channel) error {
	for i := 0; i < 5; i++ {
		body := []byte(fmt.Sprintf("number: %d", i+1))

		if err := ch.Send(body); err != nil {
			return err
		}
	}

	return nil
}

func streamInfiniteNumbers(ch *channel.Channel) error {
	for i := 0; ; i++ {
		text := fmt.Sprintf("number: %d", i+1)

		if err := ch.Send([]byte(text)); err != nil {
			return err
		}
	}
}

func streamEchoing(ch *channel.Channel) error {
	for {
		incoming, err := ch.Receive()
		if err != nil {
			return err
		}

		if incoming.IsTerminated() || ch.IsClosed() {
			return nil
		}

		if err := ch.Send(incoming.BodyBytes()); err != nil {
			return err
		}
	}
}

func streamConstantRate(ch *channel.Channel) error {
	firstMsg, err := ch.Receive()
	if err != nil {
		return err
	}

	dur, err := time.ParseDuration(string(firstMsg.BodyBytes()))
	if err != nil {
		return err
	}

	for {
		if ch.IsClosed() {
			return nil
		}

		if err := ch.SendNonblock([]byte("tick")); err != nil {
			return err
		}

		<-time.After(dur)
	}
}

func streamSteppedRate(ch *channel.Channel) error {
	firstMsg, err := ch.Receive()
	if err != nil {
		return err
	}

	parts := strings.Split(string(firstMsg.BodyBytes()), " ")
	if len(parts) != 4 {
		return fmt.Errorf("stepped rate handler need 4 components")
	}

	nOne, err := strconv.ParseUint(parts[0], 10, 64)
	if err != nil {
		return err
	}

	nOneDelay, err := time.ParseDuration(parts[1])
	if err != nil {
		return err
	}

	nTwo, err := strconv.ParseUint(parts[2], 10, 64)
	if err != nil {
		return err
	}

	nTwoDelay, err := time.ParseDuration(parts[3])
	if err != nil {
		return err
	}

	var mux, count uint64 = 0, 0

	for {
		if ch.IsClosed() {
			return nil
		}

		if err := ch.SendNonblock([]byte("tick")); err != nil {
			return err
		}

		delay := nOneDelay
		if mux == 1 {
			delay = nTwoDelay
		}

		if mux == 0 && count == nOne-1 {
			count = 0
			mux = 1
		} else if mux == 1 && count == nTwo-1 {
			count = 0
			mux = 0
		}

		<-time.After(delay)
		count += 1
	}
}

func createRouter(t *testing.T, td RouterInitTest) (
	*router.Router, context.CancelFunc,
) {
	ctx, cancel := context.WithCancel(context.Background())

	minClientPollDelay := td.MinClientPollDelay
	if minClientPollDelay == 0 {
		minClientPollDelay = 50 * time.Millisecond
	}

	maxClientPollDelay := td.MaxClientPollDelay
	if maxClientPollDelay == 0 {
		maxClientPollDelay = 250 * time.Millisecond
	}

	r, err := router.Builder().
		WithBaseContext(ctx).
		WithLogger(logrus.New().WithField("testing", true)).
		WithChannelIdBytesNumber(8).
		WithTraceIdBytesNumber(8).
		WithRouteResumePollTimeout(td.RoutePollDelay).
		WithClientPollDelays(minClientPollDelay, maxClientPollDelay).
		Build()

	if err != nil {
		t.Fatalf("failed to build router: %v\n", err)
	}

	r.Route(RouteOneshotInstantError).Oneshot(oneshotInstantError)
	r.Route(RouteOneshotDelayedError).Oneshot(oneshotErrorAfterDelay)
	r.Route(RouteOneshotInstantAnswer).Oneshot(oneshotInstantAnswer)
	r.Route(RouteOneshotDelayedAnswer).Oneshot(oneshotDelayedAnswer)

	r.Route(RouteStreamInstantError).Stream(streamInstantError)
	r.Route(RouteStreamDelayedError).Stream(streamDelayedError)
	r.Route(RouteStreamErrorAfterResponse).Stream(streamErrAfterResponse)
	r.Route(RouteStreamFiveNumbers).Stream(streamFiveNumbers)
	r.Route(RouteStreamInfiniteNumbers).Stream(streamInfiniteNumbers)
	r.Route(RouteStreamEchoing).Stream(streamEchoing)
	r.Route(RouteStreamConstantRate).Stream(streamConstantRate)
	r.Route(RouteStreamSteppedRate).Stream(streamSteppedRate)

	return r, cancel
}

func feedTestRequest(
	t *testing.T,
	r *router.Router,
	req *http.Request,
	inJSON bool,
) (*http.Request, *http.Response, *message.Message) {
	respRecorder := httptest.NewRecorder()
	r.ServeHTTP(respRecorder, req)

	resp := respRecorder.Result()
	contentType := resp.Header.Get("content-type")

	wrongJsonResponse := inJSON && contentType != "application/json"
	wrongProtoResponse := !inJSON && contentType != "application/octet-stream"

	if wrongJsonResponse || wrongProtoResponse {
		t.Fatalf(
			"invalid content-type received (inJSON: %v): '%v'\n",
			inJSON,
			contentType,
		)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read router response body bytes: %v\n", err)
	}

	respMsg, err := utils.ParseMessageFromBytes(respBody, inJSON)
	if err != nil {
		t.Fatalf("failed to parse response message: %v\n", err)
	}

	return req, resp, respMsg
}

type ReqResFn func(int, *message.Message) (TestReqRes, bool)

type RouterInitTest struct {
	RoutePollDelay     time.Duration
	MinClientPollDelay time.Duration
	MaxClientPollDelay time.Duration
}

type RouterTest struct {
	RouterInit       RouterInitTest
	RouteName        string
	NumThreads       int
	ThreadStartDelay time.Duration
	ReqRes           []TestReqRes
	ReqResFn         ReqResFn
}

type TestReqRes struct {
	waitBefore time.Duration
	waitAfter  time.Duration

	request  *TestRequest
	response *TestResponse
}

type TestRequest struct {
	isJSON          bool
	msg             *TestMessage
	sendIfNotClosed bool
}

type TestResponse struct {
	msg *TestMessage
}

type TestMessage struct {
	mayBeTerminated bool
	mayBeEmpty      bool

	isTerminated           bool
	isNotReady             bool
	isMayBeNotReady        bool
	isError                bool
	isEmpty                bool
	dontCheckBody          bool
	error                  string
	body                   string
	clientPollDelayBetween []time.Duration
}

func (trr *TestReqRes) BuildHTTPRequest(
	t *testing.T,
	routeName string,
	channelId string,
) (*http.Request, *message.Message) {
	msg := trr.BuildRequestMessage(t, routeName, channelId)
	inJSON := trr.request.isJSON

	bodyBytes, err := msg.Serialize(inJSON)
	if err != nil {
		t.Fatalf("failed to serialized message: %d\n", err)
	}

	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodPost,
		"/cp_testing",
		bytes.NewReader(bodyBytes),
	)
	if err != nil {
		t.Fatalf("failed to build a http request: %v\n", err)
	}

	if inJSON {
		req.Header.Add("content-type", "application/json")
	} else {
		req.Header.Add("content-type", "application/octet-stream")
	}

	return req, msg
}

func (trr *TestReqRes) BuildRequestMessage(
	t *testing.T,
	routeName string,
	channelId string,
) *message.Message {
	b := message.Builder().
		WithTraceId("test-traceid").
		WithChannelId("this-channel-will-be-replaced-below")

	if trr.request != nil && trr.request.msg != nil {
		if trr.request.msg.isTerminated {
			b.WithTerminated(true)
		}

		b.WithBodyBytes([]byte(trr.request.msg.body))
	}

	b.WithRouteName(routeName)

	msg, err := b.Build()
	if err != nil {
		t.Fatalf("failed to build a message: %v\n", err)
	}

	msg.SetChannelId(channelId)

	return msg
}

func (trr *TestReqRes) CheckResponse(
	t *testing.T,
	reqIdx int,
	req *http.Request,
	reqMsg *message.Message,
	resp *http.Response,
	respMsg *message.Message,
) {
	// reqMsg := trr.request.msg
	expectedMsg := trr.response.msg
	t.Logf("CheckResponse %d: %v\n", reqIdx, respMsg)

	if reqIdx != 0 && respMsg.ChannelId() != reqMsg.ChannelId() {
		t.Fatalf(
			"invalid response ChannelId: %s (expected: %s)\n",
			respMsg.ChannelId(),
			reqMsg.ChannelId(),
		)
	}

	if respMsg.TraceId() != reqMsg.TraceId() {
		t.Fatalf(
			"invalid response TraceId: %s (expected: %s)\n",
			respMsg.TraceId(),
			reqMsg.TraceId(),
		)
	}

	if respMsg.RouteName() != reqMsg.RouteName() {
		t.Fatalf(
			"invalid response RouteName: %s (expected: %s)\n",
			respMsg.RouteName(),
			reqMsg.RouteName(),
		)
	}

	if expectedMsg.isError != respMsg.IsError() {
		t.Fatalf(
			"response isError: %v (expected: %v)\n",
			respMsg.IsError(),
			expectedMsg.isError,
		)
	}

	if respMsg.IsError() && (respMsg.ErrorMessage() != expectedMsg.error) {
		t.Fatalf(
			"wrong response error message: %s (expected: %v)\n",
			respMsg.ErrorMessage(),
			expectedMsg.error,
		)
	}

	if !expectedMsg.isMayBeNotReady {
		if expectedMsg.isNotReady != respMsg.IsNotReady() {
			t.Fatalf(
				"response isNotReady: %v (expected: %v)\n",
				respMsg.IsNotReady(),
				expectedMsg.isNotReady,
			)
		}
	}

	if !expectedMsg.mayBeTerminated {
		if expectedMsg.isTerminated != respMsg.IsTerminated() {
			t.Fatalf(
				"response isTerminated: %v (expected: %v)\n",
				respMsg.IsTerminated(),
				expectedMsg.isTerminated,
			)
		}
	}

	if !expectedMsg.mayBeEmpty {
		if expectedMsg.isEmpty != respMsg.IsEmpty() {
			t.Fatalf(
				"response isEmpty: %v (expected: %v)\n",
				respMsg.IsEmpty(),
				expectedMsg.isEmpty,
			)
		}
	}

	if !expectedMsg.dontCheckBody && !respMsg.IsNotReady() {
		if expectedMsg.body != string(respMsg.BodyBytes()) {
			t.Fatalf(
				"response has body: %v (expected: %v)\n",
				string(respMsg.BodyBytes()),
				expectedMsg.body,
			)
		}
	}

	if pair := expectedMsg.clientPollDelayBetween; pair != nil {
		lower, upper := pair[0], pair[1]
		delay := respMsg.PollDelay()

		if delay < lower || delay > upper {
			t.Fatalf(
				"response has wrong PollDelay: %v (expected between %v and %v)\n",
				delay,
				lower,
				upper,
			)
		}
	}
}

type statelessMiddleware struct {
	fn func(*Channel, *Message) error
}

func middlewareFn(fn func(*Channel, *Message) error) ChannelMiddleware {
	return &statelessMiddleware{fn}
}

func (sm *statelessMiddleware) Clone() ChannelMiddleware {
	return sm
}

func (sm *statelessMiddleware) RunBeforePolling(ch *Channel, msg *Message) error {
	return sm.fn(ch, msg)
}
