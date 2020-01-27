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
import * as classnames from "classnames";

const css = require("./SVGIcon.scss");

interface Props {
  name: string;
  size: number | [number, number];
  color: string;
  animated?: boolean;
  onClick?: (event: React.MouseEvent<SVGElement>) => void;
  marginLeft?: number;
  marginRight?: number;
}

export function Icon({
  name,
  size,
  color,
  animated,
  marginLeft,
  marginRight,
  onClick
}: Props) {
  const width = Array.isArray(size) ? size[0] : size;
  const height = Array.isArray(size) ? size[1] : size;
  const handleClick = (event: React.MouseEvent<SVGElement>) => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <svg
      width={width}
      height={height}
      style={{ marginLeft, marginRight, color }}
      onClick={handleClick}
      className={classnames(css.container, {
        [css.rotating]: animated,
        [css.clickable]: Boolean(onClick)
      })}
    >
      <use xlinkHref={`#${name}`} />
    </svg>
  );
}
