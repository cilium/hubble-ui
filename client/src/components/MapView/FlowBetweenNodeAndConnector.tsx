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
import { isBottomNode, isTopNode } from "../App/utils";
import { FlowArrow } from "./FlowArrow";
import { flowNodeConnectorProvider } from "./state/providers";
import {
  CURVE_RADIUS,
  FLOW_WIDTH,
  H_PADDING,
  NODE_HEADER_HEIGHT,
  NODE_WIDTH,
  OUTER_POINT_PADDING
} from "./utils/constants";
import { lineIntersect, putPointOnLine } from "./utils/geometry";

const protocolors = require("../App/protocolors.scss");
const css = require("./MapView.scss");

export const {
  Container: FlowBetweenNodeAndConnector
} = flowNodeConnectorProvider(Props => {
  return class FlowBetweenNodesClass extends React.Component<typeof Props> {
    render() {
      const {
        fromNode,
        toNode,
        selected,
        visibleMode,
        applicationProtocol
      } = this.props;
      const isLoop = toNode === fromNode;
      const toNodeLeftFromFromNode = toNode.x < fromNode.x;
      const toNodeRightromFromNode = toNode.x > fromNode.x;
      const toNodeInOneColumnWithFromNode = toNode.x === fromNode.x;
      const toNodeRightOrInOneColumnWithFromNode = toNode.x >= fromNode.x;
      const toNodeLeftOrInOneColumnWithFromNode = toNode.x <= fromNode.x;
      const isToNodeIsAboveNode = isTopNode(toNode) || isBottomNode(fromNode);

      const fromY = isToNodeIsAboveNode
        ? fromNode.y - 1
        : fromNode.y + NODE_HEADER_HEIGHT / 2;
      // const fromX = fromNode.x + (toNodeLeftFromFromNode ? -2 : fromNode.width + 2);
      const fromX = isToNodeIsAboveNode
        ? fromNode.x + fromNode.width / 2
        : fromNode.x + fromNode.width + 2;
      const { x: toX, y: toY } = toNode.connectors[fromNode.endpoint.id];
      const flowClassName = [
        protocolors[`${applicationProtocol}Flow`] ||
          protocolors[selected ? "otherSelectedBoldFlow" : "otherBoldFlow"]
      ].join(" ");
      const arrowColor = [
        protocolors[`${applicationProtocol}Arrow`] ||
          protocolors[selected ? "otherSelectedArrow" : "otherArrow"]
      ].join(" ");
      const fogged = visibleMode === "fogged";
      if (isLoop) {
        const fx = fromX;
        const fy = fromY;
        const fnx = fromNode.x;
        const fny = fromNode.y;
        const path = [
          `M${fx},${fy} ${fx + 6},${fy}`,
          `C${fx + 24},${fy} ${fx + 24},${fy} ${fx + 24},${fy - 24}`,
          `C${fx + 24} ${fny - 24},${fx + 24},${fny - 24} ${fx + 10},${fny -
            24}`,
          `L${fnx - 10},${fny - 24}`,
          `C${fnx - 24},${fny - 24} ${fnx - 24},${fny - 24} ${toX},${fy - 30}`,
          `L${toX},${toY}`
        ].join(" ");

        const arrows = [];
        const interY = 9999999999;

        let ax = fx + 24;
        let ay = fny - 24 - (fny - 24 - fy) / 2;
        arrows.push(
          <FlowArrow
            key={`${fx + 24}:${fy}:${ax}:${ay}`}
            className={arrowColor}
            fromX={fx + 24}
            fromY={fy}
            toX={ax}
            toY={ay}
          />
        );

        ax = toX - (toX - fx) / 2 - 24;
        ay = fny - 24;
        arrows.push(
          <FlowArrow
            key={`${fx + 24}:${fny - 24}:${ax}:${ay}`}
            className={arrowColor}
            fromX={fx + 24}
            fromY={fny - 24}
            toX={ax}
            toY={ay}
          />
        );

        arrows.push(
          <FlowArrow
            key={`${toX}:${fny - 24}:${toX}:${toY - 20}`}
            className={arrowColor}
            fromX={toX}
            fromY={fny - 24}
            toX={toX}
            toY={toY - 20}
          />
        );

        return (
          <g opacity={fogged ? 0.25 : 1}>
            <path
              d={path}
              strokeWidth={FLOW_WIDTH}
              fill="none"
              className={flowClassName}
            />
            {arrows}
          </g>
        );
      } else if (isToNodeIsAboveNode || toNodeLeftOrInOneColumnWithFromNode) {
        const path = `M${fromX},${fromY} ${toX},${toY}`;
        const arrows = [];
        const arrowLineIntersect = lineIntersect.bind(
          null,
          fromX,
          fromY,
          toX,
          toY
        );
        const interY = 9999999999;

        if (isToNodeIsAboveNode) {
          const diff = toX - fromX;
          arrows.push(
            arrowLineIntersect(
              fromX + diff / 1.25,
              -interY,
              fromX + diff / 1.25,
              interY
            )
          );
          arrows.push(
            arrowLineIntersect(
              fromX + diff / 2,
              -interY,
              fromX + diff / 2,
              interY
            )
          );
          arrows.push(
            arrowLineIntersect(
              fromX + diff / 4,
              -interY,
              fromX + diff / 4,
              interY
            )
          );
        } else if (toNodeLeftOrInOneColumnWithFromNode) {
          arrows.push(arrowLineIntersect(fromX, -interY, fromX - 40, interY));
          arrows.push(arrowLineIntersect(fromX, -interY, toX + 60, interY));
          arrows.push(arrowLineIntersect(fromX, -interY, toX - 60, interY));
          arrows.push(arrowLineIntersect(toX, -interY, toX + 25, interY));
        }

        return (
          <g opacity={fogged ? 0.25 : 1}>
            <path
              d={path}
              strokeWidth={FLOW_WIDTH}
              fill="none"
              className={flowClassName}
            />
            {arrows.map(({ x: arrowToX, y: arrowToY }) => (
              <FlowArrow
                key={`${fromX}:${fromY}:${arrowToX}:${arrowToY}`}
                className={arrowColor}
                fromX={fromX}
                fromY={fromY}
                toX={arrowToX}
                toY={arrowToY}
              />
            ))}
          </g>
        );
      } else {
        const startCurveOffset = toNodeRightOrInOneColumnWithFromNode
          ? CURVE_RADIUS
          : -CURVE_RADIUS;
        // const endCurveOffset = toNodeLeftOrInOneColumnWidthFromNode
        //   ? CURVE_RADIUS
        //   : -CURVE_RADIUS;
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

        const gapWidth = NODE_WIDTH + H_PADDING;
        const gapsBetweenNodes = Math.abs((toNode.x - fromNode.x) / gapWidth);

        const arrows = [];
        const arrowLineIntersect = lineIntersect.bind(
          null,
          startCurveEndPoint.x,
          startCurveEndPoint.y,
          endCurveStartPoint.x,
          endCurveStartPoint.y
        );
        const interY = 9999999999;
        if (gapsBetweenNodes === 0) {
          const interX = endCurveStartPoint.x - OUTER_POINT_PADDING / 3.5;
          arrows.push(arrowLineIntersect(interX, -interY, interX, interY));
        } else {
          const offset = toNodeLeftFromFromNode ? -gapWidth : gapWidth;
          let interX = toNodeLeftFromFromNode
            ? startCurveEndPoint.x - OUTER_POINT_PADDING * 1.5
            : startCurveEndPoint.x + OUTER_POINT_PADDING * 1.5;
          for (let i = 1; i <= gapsBetweenNodes; i += 1, interX += offset) {
            arrows.push(arrowLineIntersect(interX, -interY, interX, interY));
          }
        }

        return (
          <g opacity={fogged ? 0.25 : 1}>
            <path
              d={path}
              strokeWidth={FLOW_WIDTH}
              fill="none"
              className={flowClassName}
            />
            {arrows.map(({ x: arrowToX, y: arrowToY }) => (
              <FlowArrow
                key={`${startCurveEndPoint.x}:${startCurveEndPoint.y}:${arrowToX}:${arrowToY}`}
                className={arrowColor}
                fromX={startCurveEndPoint.x}
                fromY={startCurveEndPoint.y}
                toX={arrowToX}
                toY={arrowToY}
              />
            ))}
          </g>
        );
      }
    }
  };
});
