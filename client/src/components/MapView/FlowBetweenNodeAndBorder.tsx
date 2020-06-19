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
import { isBottomNode, isLeftNode, isTopNode } from "../App/utils";
import { FlowArrow } from "./FlowArrow";
import { flowNodeBoundariesProvider } from "./state/providers";
import { BoundaryWithCoords } from "./state/types";
import {
  CURVE_RADIUS,
  FLOW_WIDTH,
  NODE_HEADER_HEIGHT,
  OUTER_POINT_PADDING
} from "./utils/constants";
import { lineIntersect, putPointOnLine } from "./utils/geometry";

const protocolors = require("../App/protocolors.scss");
const css = require("./MapView.scss");

const swap = (x: any, y: any) => [y, x];

export const {
  Container: FlowBetweenNodeAndBounds
} = flowNodeBoundariesProvider(Props => {
  return class FlowBetweenNodeAndBoundsClass extends React.Component<
    typeof Props
  > {
    renderBoundary = (boundary: BoundaryWithCoords) => {
      const { node } = this.props;
      const isLeft = isLeftNode(node);
      const isTop = isTopNode(node);
      const itBottom = isBottomNode(node);
      const { connection } = node;
      if (itBottom || isTop) {
        const calcCoords = () => {
          const fromY = node.y + (isTop ? node.height : 0);
          const fromX = node.x + node.width / 2;
          const toX = boundary.coords.x + boundary.coords.width / 2;
          const toY =
            boundary.coords.y + (isTop ? -60 : boundary.coords.height + 40);
          if (connection.type === "many-ingress-to-app") {
            return [fromX, fromY, toX, toY];
          } else {
            return [toX, toY, fromX, fromY];
          }
        };
        const [fromX, fromY, toX, toY] = calcCoords();
        const path = `M${fromX},${fromY} ${toX},${toY}`;
        const arrows = [];
        const diff = toY - fromY;
        const mult = diff > 0 ? 1 : -1;
        arrows.push(
          lineIntersect(
            fromX,
            fromY,
            toX,
            toY,
            -9999999999,
            toY - 40 * mult,
            9999999999,
            toY - 40 * mult
          )
        );
        return (
          <g opacity={1}>
            <path
              d={path}
              strokeWidth={FLOW_WIDTH * 1.5}
              fill="none"
              className={protocolors["fromNodeToBoundFlow"]}
            />
            {arrows.map(({ x: arrowToX, y: arrowToY }) => (
              <FlowArrow
                key={`${fromX}:${fromY}:${arrowToX}:${arrowToY}`}
                className={protocolors["fromNodeToBoundArrow"]}
                fromX={fromX}
                fromY={fromY}
                toX={arrowToX}
                toY={arrowToY}
              />
            ))}
            <circle
              cx={connection.type === "many-ingress-to-app" ? toX : fromX}
              cy={connection.type === "many-ingress-to-app" ? toY : fromY}
              r={6}
              className={protocolors["boundCircle"]}
              strokeWidth="3"
            />
          </g>
        );
      } else if (isLeft) {
        const calcCoords = () => {
          const fromY = node.y + NODE_HEADER_HEIGHT / 2;
          const fromX = node.x + node.width + 2;
          const toX = boundary.coords.x - 40;
          const toY = Math.min(
            Math.max(boundary.coords.y + 40, fromY),
            boundary.coords.y + boundary.coords.height - 40
          );
          if (connection.type === "many-ingress-to-app") {
            return [fromX, fromY, toX, toY];
          } else {
            return [toX, toY, fromX, fromY];
          }
        };
        const [fromX, fromY, toX, toY] = calcCoords();
        const startCurveOffset = CURVE_RADIUS;
        const endCurveOffset = -CURVE_RADIUS;
        const startCurveEndPoint = putPointOnLine(
          fromX + startCurveOffset * 2,
          fromY,
          toX + endCurveOffset,
          toY,
          CURVE_RADIUS
        );
        const startCurveStartCoord = `${fromX + startCurveOffset},${fromY}`;
        const startCurveOuterCoord = `${fromX + startCurveOffset * 2},${fromY}`;
        const startCurveEndCoord = `${startCurveEndPoint.x},${startCurveEndPoint.y}`;
        const pathStart = `M${fromX},${fromY} ${startCurveStartCoord} C${startCurveOuterCoord} ${startCurveOuterCoord} ${startCurveEndCoord}`;
        const endCurveStartPoint = putPointOnLine(
          toX + endCurveOffset * 2,
          toY,
          fromX + startCurveOffset,
          fromY,
          CURVE_RADIUS
        );
        const endCurveStartCoord = `${endCurveStartPoint.x},${endCurveStartPoint.y}`;
        const endCurveOuterCoord = `${toX + endCurveOffset * 2},${toY}`;
        const endCurveEndCoord = `${toX + endCurveOffset},${toY}`;
        const pathEnd = `L${endCurveStartCoord} C${endCurveOuterCoord} ${endCurveOuterCoord} ${endCurveEndCoord} L${toX},${toY}`;
        const path = `${pathStart} ${pathEnd}`;

        const arrows = [];
        const arrowLineIntersect = lineIntersect.bind(
          null,
          startCurveEndPoint.x,
          startCurveEndPoint.y,
          endCurveStartPoint.x,
          endCurveStartPoint.y
        );
        const interY = 9999999999;
        const interX = startCurveEndPoint.x + OUTER_POINT_PADDING * 1.5;
        arrows.push(arrowLineIntersect(interX, -interY, interX, interY));

        return (
          <g opacity={1}>
            <path
              d={path}
              strokeWidth={FLOW_WIDTH * 1.5}
              fill="none"
              className={protocolors["fromNodeToBoundFlow"]}
            />
            {arrows.map(({ x: arrowToX, y: arrowToY }) => (
              <FlowArrow
                key={`${startCurveEndPoint.x}:${startCurveEndPoint.y}:${arrowToX}:${arrowToY}`}
                className={protocolors["fromNodeToBoundArrow"]}
                fromX={startCurveEndPoint.x}
                fromY={startCurveEndPoint.y}
                toX={arrowToX}
                toY={arrowToY}
              />
            ))}
            <circle
              cx={connection.type === "many-ingress-to-app" ? toX : fromX}
              cy={connection.type === "many-ingress-to-app" ? toY : fromY}
              r={6}
              className={protocolors["boundCircle"]}
              strokeWidth="3"
            />
          </g>
        );
      }
      return null;
    };

    render() {
      const { boundaries } = this.props;
      if (!boundaries) {
        return null;
      }
      return boundaries.map(boundary => (
        <React.Fragment key={`${boundary.type}-${boundary.title}`}>
          {this.renderBoundary(boundary)}
        </React.Fragment>
      ));
    }
  };
});
