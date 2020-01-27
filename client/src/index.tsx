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
import "babel-polyfill";
import * as React from "react";
import * as ReactDOM from "react-dom";
// vendor css libraries
import "react-select/dist/react-select.css";
import "react-tippy/dist/tippy.css";
import "react-virtualized/styles.css";
import { App } from "./App";
import { domNodes } from "./dom-nodes";
// custom blueprint
import "./blueprint.css";
// global css styles
import "./index.scss";
// import "./editor.css";

function handleRouteError(err: Error) {}

window.onerror = function(msg, url, lineNo, columnNo, error) {
  if (error) {
    handleRouteError(error);
  } else if (typeof msg === "string") {
    handleRouteError(new Error(msg));
  }
};

try {
  ReactDOM.render(<App />, domNodes.appRoot);
} catch (err) {
  handleRouteError(err);
}
