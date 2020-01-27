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
import { flowNodeConnectorProvider } from "./state/providers";

const protocolors = require("../App/protocolors.scss");

export const { Container: FlowNodeConnector } = flowNodeConnectorProvider(
  Props => {
    type Props = typeof Props;
    return class ConnectorClass extends React.Component<Props> {
      render() {
        const {
          fromNode,
          toNode,
          selected,
          visibleMode,
          applicationProtocol
        } = this.props;
        const className = [
          protocolors[`${applicationProtocol}Circle`] ||
            protocolors[selected ? "otherSelectedCircle" : "otherCircle"]
        ].join(" ");
        const { x: toX, y: toY } = toNode.connectors[fromNode.endpoint.id];
        const fogged = visibleMode === "fogged";
        return (
          <g opacity={fogged ? 0.25 : 1}>
            <circle
              cx={toX}
              cy={toY}
              r={4}
              className={className}
              strokeWidth="2"
            />
          </g>
        );
      }
    };
  }
);
