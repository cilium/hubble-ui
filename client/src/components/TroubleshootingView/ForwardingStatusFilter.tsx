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
  ButtonGroup,
  Menu,
  MenuItem,
  Popover
} from "@blueprintjs/core";
import { find } from "lodash";
import * as React from "react";
import { ForwardingStatus } from "../../graphqlTypes";
import { provide } from "../../state";
import { pushAppUrl } from "../Routing/state/actions";
import { getFlowsForwardingStatusRouteState } from "../Routing/state/selectors";

interface OwnProps {
  targetClassName?: string;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({
    forwardingStatus: getFlowsForwardingStatusRouteState(state)
  }),
  mapDispatchToProps: {
    pushAppUrl
  }
});

interface FilterOption {
  value: string;
  title: string;
}

const filters: FilterOption[] = [
  {
    value: "",
    title: "All Statuses"
  }
].concat([
  {
    value: ForwardingStatus.FORWARDED,
    title: "Forwarded"
  },
  {
    value: ForwardingStatus.DROPPED,
    title: "Dropped"
  }
]);

export const { Container: ForwardingStatusFilter } = provider(() => props => {
  const initialValue = props.forwardingStatus || "";
  const [value, setValue] = React.useState<string>(initialValue);
  const onChange = (option: FilterOption) => {
    setValue(option.value);
    props.pushAppUrl({
      flowsForwardingStatus: option.value
    });
  };
  const getLabel = () => {
    const found = find(filters, f => f.value === value);
    return found ? found.title : "";
  };

  return (
    <Popover
      targetClassName={props.targetClassName}
      content={
        <Menu>
          {filters.map(filter => (
            <MenuItem
              active={value === filter.value}
              text={filter.title}
              onClick={() => onChange(filter)}
            />
          ))}
        </Menu>
      }
    >
      <ButtonGroup>
        <Button
          minimal
          small={true}
          intent={
            value === ForwardingStatus.FORWARDED
              ? "success"
              : value === ForwardingStatus.REJECTED ||
                value === ForwardingStatus.DROPPED
              ? "danger"
              : "none"
          }
          rightIcon="chevron-down"
          text={getLabel()}
        />
      </ButtonGroup>
    </Popover>
  );
});
