package e2e

import (
	"net/http"
	"net/url"
)

func (tc *TestsController) ServeHTTP(resp http.ResponseWriter, req *http.Request) {
	tc.checkRequestForStateChange(req)

	if tc.apiserverHttpHandler == nil {
		return
	}

	tc.apiserverHttpHandler.ServeHTTP(resp, req)
}

// NOTE: The idea is to include e2e test information in http request when calling
// cypress `visit()` method
func (tc *TestsController) checkRequestForStateChange(req *http.Request) {
	qp := req.URL.Query()
	e2eParam := qp.Get("e2e")
	qp.Del("e2e")
	req.URL.RawQuery = qp.Encode()

	headerQueryParams, err := url.ParseQuery(req.Header.Get("x-hubble-ui-page-query"))
	if err != nil {
		headerQueryParams = url.Values{}
	}

	if e2eSecondParam := headerQueryParams.Get("e2e"); len(e2eSecondParam) > 0 {
		e2eParam = e2eSecondParam
	}

	if len(e2eParam) == 0 {
		return
	}

	tc.log.Info("trying to mutate mock state from http request", "e2e-query-param", e2eParam)

	testSettings := new(TestSettings)
	testSettings.FillFromParamString(e2eParam)

	tc.clients.Reset()

	tc.log.Info("TestSettings created", testSettings.LogAttrs()...)
	tc.applyTestSettings(testSettings)
}
