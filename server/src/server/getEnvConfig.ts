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
import * as path from "path";

/**
 * Returns config from env variables
 */
export function getEnvConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const hubbleService = process.env.HUBBLE_SERVICE;
  const hubblePort = process.env.HUBBLE_PORT;
  const hubblePeerEnabled = process.env.HUBBLE_PEER === "true";
  const clientStaticDir = process.env.WATCH
    ? path.join(path.dirname(path.dirname(path.dirname(__dirname))), "client")
    : path.join(
        path.dirname(path.dirname(path.dirname(path.dirname(__dirname)))),
        "client"
      );

  const port = process.env.PORT || 12000;
  const metricsPort = process.env.METRICS_PORT || 7070;

  const cookieSecret =
    process.env.COOKIE_SECRET ||
    "super custom secret for signed cookies at covalent.io";

  // https://nodejs.org/api/https.html#https_server_headerstimeout
  const serverHeadersTimeoutMs = parseInt(
    process.env.SERVER_HEADERS_TIMEOUT_MS || "120000",
    10
  );

  const clusterHealthTimeoutSeconds: number = process.env
    .CLUSTER_HEALTH_TIMEOUT_SECONDS
    ? +process.env.CLUSTER_HEALTH_TIMEOUT_SECONDS
    : 60;

  return {
    isProduction,
    port,
    metricsPort,
    cookieSecret,
    clientStaticDir,
    serverHeadersTimeoutMs,
    clusterHealthTimeoutSeconds,
    hubbleService,
    hubblePort,
    hubblePeerEnabled
  };
}
