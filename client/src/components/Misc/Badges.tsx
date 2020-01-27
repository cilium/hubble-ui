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

const css = require("./Badges.scss");

export const NewBadge = () => (
  <div className={`badge ${css.badge} ${css.new}`}>new</div>
);
export const DelBadge = () => (
  <div className={`badge ${css.badge} ${css.del}`}>del</div>
);

interface CircleProps {
  readonly className?: string;
  readonly size?: number;
  readonly variant?: "small" | "medium" | "big";
}

const Circle: React.SFC<CircleProps> = props => {
  const { className, variant = "small", size } = props;
  let finalSize: number | undefined = size;
  if (typeof finalSize !== "number") {
    switch (variant) {
      case "medium":
        finalSize = 7;
        break;
      case "big":
        finalSize = 10;
        break;
      default:
        finalSize = 5;
        break;
    }
  }
  const styleSize = `${finalSize}px`;
  const style = {
    maxWidth: styleSize,
    minWidth: styleSize,
    height: styleSize,
    borderRadius: styleSize
  };
  return <div className={className} style={style} />;
};
export const NewCircle: React.SFC<CircleProps> = props => (
  <Circle {...props} className={css.newCircle} />
);

export const DelCircle: React.SFC<CircleProps> = props => (
  <Circle {...props} className={css.delCircle} />
);
