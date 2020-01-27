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
import { COLUMN_TITLE } from "./types";
import { cellRenderer, headerRenderer } from "./utils";

export const header = (
  props: TableHeaderProps,
  resize: (dataKey: string, deltaX: number) => void
) => {
  return headerRenderer({
    title: COLUMN_TITLE.DST_PROTOCOL,
    props,
    resize,
    isLast: false
  });
};

export const cell = (props: TableCellProps) => {
  return cellRenderer({
    props,
    renderer: flow => {
      if (flow.destinationElement.protocol) {
        return (
          <DestinationPort
            l34Protocol={flow.destinationElement.protocol.l34Protocol}
            port={flow.destinationElement.protocol.port}
          />
        );
      } else {
        return null;
      }
    }
  });
};

const DestinationPort = ({
  l34Protocol,
  port
}: {
  l34Protocol: string | null | undefined;
  port: number | null | undefined;
}) => (
  <>
    {typeof l34Protocol === "string" && l34Protocol}
    {typeof port === "number" && `:${port}`}
  </>
);
