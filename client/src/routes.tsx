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
import SVGSprite from "-!svg-react-loader!./components/assets/svg-sprite.svg";
import { ConnectedRouter } from "connected-react-router";
import * as React from "react";
import { AppLayoutWithRouter } from "./components/App/AppLayout";
import { history } from "./state/store";
import { Redirect } from "react-router";

const css = require("./components/App/AppView.scss");

export default () => (
  <ConnectedRouter history={history}>
    <>
      <Redirect from="/" to="/service-map/clusters/default" />
      <AppLayoutWithRouter />
      <SVGSprite className={css.svgSprite} />
    </>
  </ConnectedRouter>
);
