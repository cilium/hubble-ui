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
import { Protocol } from "../../graphqlTypes";

const protocolors = require("../App/protocolors.scss");
const css = require("./ProtocolPort.scss");

interface Props {
  readonly protocol: Protocol;
}

export const ProtocolPort: React.SFC<Props> = props => {
  const { protocol } = props;

  if (typeof protocol.port !== "number") {
    return null;
  }

  const applicationProtocolNorm = protocol.applicationProtocol
    ? protocol.applicationProtocol.toLowerCase()
    : "other";

  const portClassName = [
    css.wrapper,
    protocolors[`${applicationProtocolNorm}Port`] || protocolors["otherPort"]
  ].join(" ");

  return <div className={portClassName}>{protocol.port}</div>;
};
