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
import { TableCellProps, TableHeaderProps } from "react-virtualized";
import { processFunctionName } from "../../../components/App/utils";
import { COLUMN_TITLE } from "./types";
import { cellRenderer, headerRenderer } from "./utils";

const css = require("../FlowsTable.scss");

export const header = (
  props: TableHeaderProps,
  resize: (dataKey: string, deltaX: number) => void
) => {
  return headerRenderer({
    title: COLUMN_TITLE.DST_FUNCTION,
    props,
    resize,
    isLast: false
  });
};

export const cell = (props: TableCellProps) => {
  return cellRenderer({
    props,
    renderer: flow => {
      let destinationL7Protocol: string | null | undefined;
      if (flow.destinationElement.protocol) {
        destinationL7Protocol = flow.destinationElement.protocol.l7Protocol;
      }
      if (props.rowData.destinationElement.function) {
        const { metricsResponse } = props.rowData.destinationElement.function;
        return (
          <span className={css.functionName}>
            {processFunctionName(
              props.rowData.destinationElement.function.name,
              destinationL7Protocol,
              props.rowData.destinationElement.function.dnsResponse,
              props.rowData.destinationElement.function.httpResponse
            )}{" "}
            {metricsResponse ? (
              <span>{metricsResponse.latencyMs} ms</span>
            ) : null}
          </span>
        );
      } else {
        return null;
      }
    }
  });
};
