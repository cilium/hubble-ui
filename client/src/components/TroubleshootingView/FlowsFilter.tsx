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
import { provide } from "../../../src/state";
import { pushAppUrl } from "../Routing/state/actions";
import {
  getFlowsFilterInputRouteState,
  getFlowsRejectedReasonsFromQueryParams
} from "../Routing/state/selectors";
import {
  FilterWithAutocomplete,
  FlowsFilterSuggestionType,
  Suggestion,
  SuggestionDirection
} from "./FilterWithAutocomplete";

const provider = provide({
  mapStateToProps: state => ({
    filterInput: getFlowsFilterInputRouteState(state),
    rejectedReasons: getFlowsRejectedReasonsFromQueryParams(state)
  }),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

const cleanUpDirections = (query: string) => {
  return query.replace(/from:|to:/, "").trim();
};

const getInitialSelected = (
  filterInput: string | null,
  rejectedResonsInput: string | null
): Suggestion[] => {
  if (!filterInput && !rejectedResonsInput) {
    return [];
  }

  const filter = filterInput
    ? filterInput.split(",").map(text => {
        let direction: SuggestionDirection = "";

        if (text.includes("from:")) {
          direction = "from:";
        } else if (text.includes("to:")) {
          direction = "to:";
        }

        return {
          direction,
          type: FlowsFilterSuggestionType.UNKNOWN,
          text: cleanUpDirections(text)
        };
      })
    : [];

  const rejectedResons = rejectedResonsInput
    ? rejectedResonsInput.split(",").map(text => ({
        direction: "",
        type: FlowsFilterSuggestionType.UNKNOWN,
        text: `reason=${text}`
      }))
    : [];

  return [...(filter as Suggestion[]), ...(rejectedResons as Suggestion[])];
};

export const { Container: FlowsFilter } = provider(() => props => {
  const [initialValue, setInitialValue] = React.useState(
    getInitialSelected(props.filterInput, props.rejectedReasons)
  );

  React.useEffect(() => {
    setInitialValue(
      getInitialSelected(props.filterInput, props.rejectedReasons)
    );
  }, [props.filterInput, props.rejectedReasons]);

  const handleFilterWithAutocompletChange = (selected: Suggestion[]) => {
    const flowsFilterInput = selected.length
      ? selected
          .filter(s => !s.text.startsWith("reason"))
          .map(s => `${s.direction}${s.text}`)
          .join(",")
      : "";
    const flowsRejectedReasons = selected.length
      ? selected
          .filter(s => s.text.startsWith("reason"))
          .map(s => s.text.replace(/reason=/, "").trim())
          .join(",")
      : "";

    props.pushAppUrl({
      flowsFilterInput,
      flowsRejectedReasons
    });
  };

  return (
    <FilterWithAutocomplete
      placeholder="Filter labels key=val, ip=0.0.0.0, dns=google.com"
      onChange={handleFilterWithAutocompletChange}
      initialValue={initialValue}
    />
  );
});
