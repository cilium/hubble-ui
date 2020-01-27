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
import Draggable from "react-draggable";
import { TableCellProps, TableHeaderProps } from "react-virtualized";
import { ExtFlow } from "../state/types";

const css = require("../FlowsTable.scss");

export const cellRenderer = ({
  props,
  renderer
}: {
  props: TableCellProps;
  renderer: (flow: ExtFlow) => JSX.Element | string | null;
}) => {
  if (props.rowData === "Loading...") {
    return <div className={css.emptyCell}>…</div>;
  } else {
    return <>{renderer(props.rowData as ExtFlow)}</>;
  }
};

export const headerRenderer = ({
  title,
  props,
  resize,
  isLast
}: {
  title: string;
  props: TableHeaderProps;
  resize: (dataKey: string, deltaX: number) => void;
  isLast: boolean;
}): JSX.Element => {
  return (
    <div className={css.title}>
      <span className={css.titleLabel}>{title}</span>
      <div>
        {!isLast && (
          <Draggable
            axis="x"
            defaultClassName="DragHandle"
            defaultClassNameDragging="DragHandleActive"
            onDrag={(event, { deltaX }) => {
              event.stopPropagation();
              resize(props.dataKey, deltaX);
            }}
          >
            <span
              className="DragHandleIcon"
              onClick={event => event.stopPropagation()}
            >
              ⋮
            </span>
          </Draggable>
        )}
      </div>
    </div>
  );
};
