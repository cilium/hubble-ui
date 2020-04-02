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

import { Application } from 'express'
import { authenticateStub } from "../auth";
import { createStaticPages } from "./createStaticPages";

export async function setupIndexPageRoute(
  app: Application,
  isProduction: boolean,
  clientStaticDir: string
) {
  if (!isProduction) {
    const proxy = require("http-proxy-middleware");
    app.use(
      proxy({
        target: "http://127.0.0.1:3000",
        ws: true,
        changeOrigin: true
      })
    );

    return;
  }

  let { indexPage } = await createStaticPages(clientStaticDir);
  indexPage = indexPage.replace(`%HUBBLE%`, '1');

  app.get("*", authenticateStub, (req, res) => {
    const { userName, userEmail, userPicture } = req.signedCookies;

    const page = indexPage
      .replace('{% USER_NAME %}', userName || '')
      .replace('{% USER_EMAIL %}', userEmail || '')
      .replace('{% USER_PICTURE %}', userPicture || '');

    res.setHeader('Content-Type', 'text/html');
    res.send(page);
  });
}
