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
import * as React from "react";
import { Icon } from "../Misc/SVGIcon";

interface IProps {
  message: string | JSX.Element;
  type: "info" | "warning" | "danger";
  title?: string;
}

enum BannerTypeColors {
  info = "#73BEF4",
  warning = "#FFB170",
  danger = "#F48F8F"
}

enum BannerTypeIcons {
  info = "circle-info",
  warning = "circle-warn",
  danger = "triangle-danger"
}

const css = require("./Banner.scss");
const Banner: React.SFC<IProps> = ({ message, type, title }) => (
  <div className={`${css.base} ${css[type]}`}>
    <div className={css.text}>
      {title && <div className={css.title}>{title}</div>}
      <div className={css.message}>{message}</div>
    </div>
    <Icon
      name={BannerTypeIcons[type]}
      size={15}
      color={BannerTypeColors[type]}
    />
  </div>
);

export default Banner;
