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
import * as classnames from "classnames";
import * as React from "react";
import { ClusterComponentStatus } from "../../graphqlTypes";
const css = require("./StatusBadge.scss");

interface StatusBadgeProps {
  status: ClusterComponentStatus;
  background?: boolean;
  live?: boolean;
}
export const StatusBadge: React.SFC<StatusBadgeProps> = ({
  status,
  background = true,
  live = true
}) => {
  const color = !live ? css.UNKNOWN : css[status];
  return (
    <span
      className={classnames(css.badge, color, {
        [css.background]: true
      })}
    >
      {!live ? "?" : status}
    </span>
  );
};
