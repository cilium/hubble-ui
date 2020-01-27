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
import { authenticateStub } from "../auth";
import { createStaticPages } from "./createStaticPages";

export async function setupIndexPageRoute(
  app,
  isProduction: boolean,
  clientStaticDir: string
) {
  let { indexPage } = await createStaticPages(clientStaticDir);
  indexPage = indexPage.replace(`%HUBBLE%`, "1");
  if (isProduction) {
    app.get("*", authenticateStub, (req, res) => {
      res.setHeader("Content-Type", "text/html");
      const { userName, userEmail, userPicture } = req.signedCookies;
      let formattedPage = indexPage.replace("{% USER_NAME %}", userName || "");
      formattedPage = formattedPage.replace(
        "{% USER_EMAIL %}",
        userEmail || ""
      );
      formattedPage = formattedPage.replace(
        "{% USER_PICTURE %}",
        userPicture || ""
      );
      res.send(formattedPage);
    });
  } else {
    const proxy = require("http-proxy-middleware");
    app.use(
      proxy({
        target: "http://127.0.0.1:3000",
        ws: true,
        changeOrigin: true
      })
    );
  }
}
