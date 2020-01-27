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
import { Button, Popover, Menu, MenuItem } from "@blueprintjs/core";
import { provide } from "../../state";
import { pushAppUrl } from "../Routing/state/actions";
import { getFlowsFilterTypeFromQueryParams } from "../Routing/state/selectors";
import { find } from "lodash";

const provider = provide({
  mapStateToProps: state => ({
    flowsFilterType: getFlowsFilterTypeFromQueryParams(state)
  }),
  mapDispatchToProps: {
    pushAppUrl
  }
});

type FilterTypes = "all" | "external" | "cross-namespace";

interface FilterOption {
  value: FilterTypes;
  title: string;
}

const filters: FilterOption[] = [
  {
    value: "all",
    title: "All Flows"
  },
  {
    value: "external",
    title: "External Destinations"
  },
  {
    value: "cross-namespace",
    title: "Cross Namespace"
  }
];

export const { Container: FlowsFilterSelector } = provider(Props => props => {
  const [value, setValue] = React.useState<FilterTypes>(props.flowsFilterType);
  const onChange = (option: FilterOption) => {
    setValue(option.value);
    props.pushAppUrl({
      flowsFilterType: option.value
    });
  };
  const getLabel = () => {
    const found = find(filters, f => f.value === value);
    return found ? found.title : "";
  };

  return (
    <Popover
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
      <Button
        minimal
        intent={value === "all" ? "none" : "primary"}
        rightIcon="chevron-down"
        text={getLabel()}
      />
    </Popover>
  );
});
