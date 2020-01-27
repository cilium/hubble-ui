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
const fs = require("fs");
const path = require("path");
const spawn = require("child_process").spawn;

const cwd = path.resolve(__dirname, "../");
const cmd = path.resolve(cwd, "node_modules/.bin/prettier");
const exec = args => spawn(cmd, args, { cwd, stdio: "inherit", shell: true });

const args = ["--list-different", "--write"];
const files = process.argv
  .slice(2)
  .map(file => path.resolve(cwd, file))
  .filter(file => fs.existsSync(file));

if (files.length > 0) {
  exec(args.concat(files.join(" ")));
} else {
  [
    `"client/!(public|build|node_modules)/**/*.@(tsx|ts|jsx|js|scss|json)"`,
    `"server/!(build|node_modules|.idea)/**/*.@(tsx|ts|jsx|js|scss|json)"`
  ].forEach(glob => exec(args.concat(glob)));
}
