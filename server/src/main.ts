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
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.development" });
}

import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as express from "express";

import * as moment from "moment";

import * as cookieParser from "cookie-parser";
import * as path from "path";

import * as uuid from "uuid";

import { authenticateStub } from "./auth";

import * as cors from "cors";
import * as metrics from "./metrics";

import { getEnvConfig } from "./server/getEnvConfig";
import { startMetricsServer } from "./server/startMetricsServer";
import { createAndSetupLogger } from "./server/createLogger";
import { applyHandleErrorsMiddleware } from "./server/handleErrorsMiddleware";
import { applyContextMiddleware } from "./server/contextMiddleware";
import { setupIndexPageRoute } from "./server/indexPageRoute";
import { createConfigDatabase } from "./server/createConfigDatabase";
import { createFlowsDatabase } from "./server/createFlowsDatabase";
import { getApolloServer } from "./server/getApolloServer";

(async () => {
  const {
    isProduction,
    port,
    clientStaticDir,
    serverHeadersTimeoutMs,
    cookieSecret
  } = getEnvConfig();
  const app = express();
  const logger = createAndSetupLogger();
  app.use(
    bodyParser.json({ limit: process.env.REQUEST_JSON_SIZE_LIMIT || "50mb" })
  );

  process.on("unhandledRejection", err => {
    logger.fatal({ err }, "Detected an unhandled promise rejection.");
  });

  logger.info("Starting Hubble UI 🔭");

  const database = createFlowsDatabase();
  const configDatabase = createConfigDatabase(logger);

  app.set("cookie_options", {
    httpOnly: true,
    signed: true,
    domain: process.env.COOKIE_DOMAIN,
    secure: false
  });

  try {
    const start = moment();
    await database.initialize();
    await configDatabase.initialize();
    logger.info(
      "Initialized DBs in %d ms",
      moment().diff(start, "milliseconds")
    );

    app.use((req: any, res, next) => {
      req.covalent = {
        path: req.path,
        start: Date.now()
      };
      next();
    });

    if (isProduction) {
      app.use(express.static(path.join(clientStaticDir, "build")));
    }

    app.use(cors());
    app.use(cookieParser(cookieSecret));
    app.use(metrics.startRequestTimer);
    app.use(metrics.startComputingMetrics);

    app.use("/graphql", compression());

    // HACK: authenticate middleware needs the config database.
    app.use((req: any, _, next) => {
      req.configDatabase = configDatabase;
      req.logger = logger.child({ req_id: uuid.v4() });
      next();
    });

    app.use("/graphql", authenticateStub);
    app.use("/policies", authenticateStub);

    await applyContextMiddleware(app, configDatabase, database);
    await getApolloServer().applyMiddleware({ app });
    await setupIndexPageRoute(app, isProduction, clientStaticDir);
    await applyHandleErrorsMiddleware(app);

    // show 500 to user
    app.use(function(err, req, res, next) {
      logger.error(err);
      res.status(500);
      res.end(res.sentry + "\n");
    });

    const server = app.listen(port);
    // Disable keep-alive timeout and let the load balancer decide when to close connections.
    // https://nodejs.org/api/http.html#http_server_keepalivetimeout
    server.keepAliveTimeout = 0;
    // Default headers timeout of 40 seconds is shorter than ELB idle connection timeout. This
    // causes unnecessary 504s.
    server.headersTimeout = serverHeadersTimeoutMs;
    logger.info(
      `Listening on port ${port} keep-alive timeout ${server.keepAliveTimeout} ms headers timeout ${server.headersTimeout} ms`
    );
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
})();

// asynchroniously start metrics server on a different port
startMetricsServer();
