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
import {
  Button,
  Checkbox,
  Intent,
  Menu,
  MenuItem,
  Popover
} from "@blueprintjs/core";
import { css } from "linaria";
import * as React from "react";
import { provide } from "../../state";
import { toggleTrafficFilter } from "../App/state/actions";
import { getMapFilters } from "../App/state/selectors";

const provider = provide({
  mapStateToProps: state => ({
    mapFilters: getMapFilters(state)
  }),
  mapDispatchToProps: {
    toggleTrafficFilter
  }
});

export const { Container: MapFiltersPopover } = provider(Props => {
  type Props = typeof Props;
  return class MapFiltersPopoverClass extends React.Component<Props> {
    onToggleHostEndpoint = () => {
      this.props.toggleTrafficFilter({
        filter: "showHostEndpoint"
      });
    };

    onToggleWorldEndpoint = () => {
      this.props.toggleTrafficFilter({
        filter: "showWorldEndpoint"
      });
    };

    someFilterChanged = () => {
      return (
        this.props.mapFilters.showHostEndpoint ||
        this.props.mapFilters.showWorldEndpoint
      );
    };

    render() {
      const { mapFilters } = this.props;
      const someFilterChanged = this.someFilterChanged();
      return (
        <Popover
          position="bottom"
          content={
            <Menu>
              <MenuItem
                text={
                  <Checkbox
                    className={styles.item}
                    checked={mapFilters.showHostEndpoint}
                    onChange={this.onToggleHostEndpoint}
                    label="Show Host Endpoint"
                  />
                }
              />
              <MenuItem
                text={
                  <Checkbox
                    className={styles.item}
                    checked={mapFilters.showWorldEndpoint}
                    onChange={this.onToggleWorldEndpoint}
                    label="Show World Endpoint"
                  />
                }
              />
            </Menu>
          }
          target={
            <Button
              minimal={true}
              intent={someFilterChanged ? Intent.PRIMARY : Intent.NONE}
              small
              icon="cog"
              className={styles.target}
            >
              View options
            </Button>
          }
        />
      );
    }
  };
});

const styles = {
  target: css`
    margin-left: 10px;
  `,
  item: css`
    margin-bottom: 10px;
    &:last-child {
      margin-bottom: 0;
    }
  `
};
