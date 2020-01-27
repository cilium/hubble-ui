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
import { getUserFromRequest } from "../auth";
import { IContext, User } from "../types";
import { getEnvConfig } from "./getEnvConfig";

export function applyContextMiddleware(app, configDatabase, database) {
  const { clusterHealthTimeoutSeconds } = getEnvConfig();
  const populateContextMiddleware = (req: any, res, next) => {
    const user: User = getUserFromRequest(req);
    const childLogger = req.logger.child({
      user: user.email
    });
    const context: IContext = {
      logger: childLogger,
      database,
      configDatabase,
      user,
      hostname: "",
      clusterHealthTimeoutSeconds
    };
    req.context = context;
    if (req.signedCookies.accessToken) {
      res.cookie("accessToken", req.signedCookies.accessToken, {
        ...app.get("cookie_options"),
        expires: new Date(Date.now() + 1000 * 60 * 60)
      });
    }
    next();
  };

  app.use("/graphql", populateContextMiddleware);
  app.use("/policies", populateContextMiddleware);
}
