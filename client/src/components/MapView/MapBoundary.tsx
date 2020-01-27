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
import { BoundaryWithCoords } from "./state/types";
import { getBoundariesInfo } from "./utils/graphs";

export const MapBoundary = ({
  boundary,
  padding = 0,
  cornerRadius = 5,
  fill,
  fillOpacity = 1,
  stroke,
  strokeWidth = 2,
  strokeDasharray = "none"
}: {
  boundary: BoundaryWithCoords;
  padding?: number;
  cornerRadius?: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}) => {
  if (boundary.coords.width <= 0 || boundary.coords.height <= 0) {
    return null;
  }
  let topYPadding = padding;
  if (boundary.title) {
    topYPadding += 20;
  }
  const boundariesInfo = getBoundariesInfo([boundary]);
  if (!fill || !stroke) {
    fill = boundariesInfo.isAppBoundary ? "#5BA5F8" : "#77B34C";
    stroke = boundariesInfo.isAppBoundary ? "#5BA5F8" : "#77B34C";
  }
  return (
    <g>
      {boundary.title && (
        <text
          x={boundary.coords.x - padding + 20}
          y={boundary.coords.y - topYPadding + 30}
          fontSize="18px"
          fontFamily="Montserrat, sans-serif"
          fontWeight={600}
          color={stroke}
        >
          {boundary.title}
        </text>
      )}
      <rect
        x={boundary.coords.x - padding}
        y={boundary.coords.y - topYPadding}
        rx={cornerRadius}
        ry={cornerRadius}
        width={boundary.coords.width + padding * 2}
        height={boundary.coords.height + padding + topYPadding}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    </g>
  );
};
