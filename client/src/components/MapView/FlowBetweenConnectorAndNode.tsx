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
import { flowProvider } from "./state/providers";
import { FLOW_WIDTH } from "./utils/constants";

const protocolors = require("../App/protocolors.scss");

export const { Container: FlowBetweenConnectorAndNode } = flowProvider(
  Props => {
    type PropsType = typeof Props;
    return class FlowBetweenConnectorAndNodeClass extends React.Component<
      typeof Props
    > {
      render() {
        const {
          fromNode,
          toNode,
          toFunction,
          toProtocol,
          applicationProtocol,
          visibleMode,
          selected
        } = this.props;
        const { x: toX, y: toY } = toNode.connectors[fromNode.endpoint.id];

        let classNames: string[] = [];
        let targetsX: number[] = [];
        let targetsY: number[] = [];
        if (toFunction) {
          targetsX.push(toNode.functionsCoords[toFunction.id!].x + 3.5);
          targetsY.push(toNode.functionsCoords[toFunction.id!].y);
          classNames.push(
            [
              protocolors[`${applicationProtocol}Flow`] ||
                protocolors[
                  selected ? "otherSelectedThinFlow" : "otherThinFlow"
                ]
            ].join(" ")
          );
          if (toNode.moreLabelsCoords[toProtocol.id]) {
            classNames.push(
              [protocolors["otherThinFlow"], protocolors["flowToMore"]].join(
                " "
              )
            );
            targetsX.push(toNode.moreLabelsCoords[toProtocol.id].x + 3.5);
            targetsY.push(toNode.moreLabelsCoords[toProtocol.id].y);
          }
        } else {
          classNames.push(
            [
              protocolors[`${applicationProtocol}Flow`] ||
                protocolors[
                  selected ? "otherSelectedThinFlow" : "otherThinFlow"
                ]
            ].join(" ")
          );
          targetsX.push(toNode.protocolsCoords[toProtocol.id].x + 3.5);
          targetsY.push(toNode.protocolsCoords[toProtocol.id].y);
        }
        return targetsX.map((targetX, i) => {
          const className = classNames[i];
          const targetY = targetsY[i];
          const path = `M${toX},${toY} L${targetX},${targetY}`;
          const fogged = visibleMode === "fogged";
          return (
            <g key={path} opacity={fogged ? 0.25 : 1}>
              <path
                d={path}
                strokeWidth={FLOW_WIDTH / 1.5}
                className={className}
              />
            </g>
          );
        });
      }
    };
  }
);
