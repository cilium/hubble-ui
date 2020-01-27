// Copyright 2019 Authors of Hubble
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as promClient from "prom-client";

export var register = promClient.register;
const NAMESPACE = "covalentio";
const SUBSYSTEM = "frontend";
const httpRequestCounter = new promClient.Counter({
  name: makeMetricName("http_request_uri_path_total"),
  help: "Total number of URI paths"
});

export function initializeMetrics() {
  promClient.collectDefaultMetrics();
}

function makeMetricName(metricName: string) {
  return NAMESPACE + "_" + SUBSYSTEM + "_" + metricName;
}

export function startComputingMetrics(req, res, next) {
  httpRequestCounter.inc();
  next();
}

export function startRequestTimer(req, res, next) {
  res.locals.startEpoch = Date.now();
  next();
}
