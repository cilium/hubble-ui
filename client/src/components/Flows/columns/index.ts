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
import { TableCellProps, TableHeaderProps } from "react-virtualized";
import * as dstEndpoint from "./dst-endpoint";
import * as dstFunction from "./dst-function";
import * as dstIp from "./dst-ip";
import * as dstPodName from "./dst-pod-name";
import * as dstProtocol from "./dst-protocol";
import * as forwardingStatus from "./forwarding-status";
import * as lastSeen from "./last-seen";
import * as srcEndpoint from "./src-endpoint";
import * as srcPodName from "./src-pod-name";
import { COLUMN_SYMBOL } from "./types";

export const createColumns = (
  resizeRow: (dataKey: string, deltaX: number) => void
): {
  readonly [key in keyof typeof COLUMN_SYMBOL]: {
    readonly header: (props: TableHeaderProps) => JSX.Element;
    readonly cell: (props: TableCellProps) => JSX.Element;
  };
} => ({
  SRC_POD_NAME: {
    header: props => srcPodName.header(props, resizeRow),
    cell: srcPodName.cell
  },
  SRC_ENDPOINT: {
    header: props => srcEndpoint.header(props, resizeRow),
    cell: srcEndpoint.cell
  },
  DST_POD_NAME: {
    header: props => dstPodName.header(props, resizeRow),
    cell: dstPodName.cell
  },
  DST_ENDPOINT: {
    header: props => dstEndpoint.header(props, resizeRow),
    cell: dstEndpoint.cell
  },
  DST_IP: {
    header: props => dstIp.header(props, resizeRow),
    cell: dstIp.cell
  },
  DST_PROTOCOL: {
    header: props => dstProtocol.header(props, resizeRow),
    cell: dstProtocol.cell
  },
  DST_FUNCTION: {
    header: props => dstFunction.header(props, resizeRow),
    cell: dstFunction.cell
  },
  FORWARDING_STATUS: {
    header: props => forwardingStatus.header(props, resizeRow),
    cell: forwardingStatus.cell
  },
  LAST_SEEN: {
    header: props => lastSeen.header(props, resizeRow),
    cell: lastSeen.cell
  }
});
