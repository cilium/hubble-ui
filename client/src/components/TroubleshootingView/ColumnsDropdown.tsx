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
import { Popover, Button, Checkbox, Menu, MenuItem } from "@blueprintjs/core";
import { provide } from "../../state";
import { toggleColumnVisibility } from "../Flows/state/actions";
import { getFlowsTableMappedColumns } from "../Flows/state/selectors";

const css = require("./ColumnsDropdown.scss");

interface OwnProps {
  readonly targetClassName?: string;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({
    columns: getFlowsTableMappedColumns(state)
  }),
  mapDispatchToProps: {
    toggleColumnVisibility
  }
});

interface State {
  readonly opened: boolean;
}

export const { Container: ColumnsIcon } = provider(Props => {
  type PropsType = typeof Props;
  return class ColumnsIconClass extends React.Component<PropsType, State> {
    state: State = {
      opened: false
    };

    onToggle = () => {
      this.setState(prevState => ({
        opened: !prevState.opened
      }));
    };

    render() {
      return (
        <Popover
          targetClassName={this.props.targetClassName}
          content={
            <Menu>
              {this.props.columns.map(({ column, label, visible }) => (
                <MenuItem
                  key={column}
                  shouldDismissPopover={false}
                  text={
                    <Checkbox
                      label={label}
                      checked={visible}
                      onChange={() => this.props.toggleColumnVisibility(column)}
                    />
                  }
                />
              ))}
            </Menu>
          }
        >
          <Button
            small
            minimal
            onClick={this.onToggle}
            rightIcon="chevron-down"
            text="Columns"
          />
        </Popover>
      );
    }
  };
});
