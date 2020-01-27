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
import * as fs from "fs";
import * as path from "path";

let indexPage;
export async function createStaticPages(clientStaticDir) {
  if (indexPage) {
    return {
      indexPage
    };
  }

  // find all REACT_APP_ env variables and replace them in index.html
  indexPage = fs.readFileSync(
    path.join(clientStaticDir, "index.html"),
    "utf-8"
  );
  if (process.env.GIT_COMMIT_SHA)
    indexPage = indexPage.replace(
      `%GIT_COMMIT_SHA%`,
      process.env.GIT_COMMIT_SHA
    );
  Object.keys(process.env).forEach(envVar => {
    if (envVar.startsWith("REACT_APP_")) {
      indexPage = indexPage.replace(`%${envVar}%`, process.env[envVar]);
    }
  });

  indexPage = indexPage.replace(/%REACT_APP_[^%]+%/g, "");

  return {
    indexPage
  };
}
