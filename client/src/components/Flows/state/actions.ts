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
import { GROUP_BY_OPTIONS } from "src/components/TroubleshootingView/state/types";
import { Flow, FlowConnection, FlowFiltersInput } from "../../../graphqlTypes";
import { createAction, createAsyncAction } from "../../../state";
import { GqlResult } from "../../App/state/types";
import { COLUMN_SYMBOL } from "../columns/types";
import { pushAppUrl } from "./../../Routing/state/actions";
import { getFlowsTableGroupByOptionsFromQueryParams } from "./../../Routing/state/selectors";
import * as queries from "./queries";

export const toggleFlowsAutoRefresh = createAction<any>(
  "Toggle flows auto refresh"
);

export const toggleColumnVisibility = createAction<COLUMN_SYMBOL>(
  "Toggle column visibility"
);

export const toggleFlowToPolicy = createAction<Flow>("Toggle flow to policy");

export const toggleFlowsPaused = createAction<Flow>("Toggle flows paused");

export const resetFlowsTableState = createAction<Flow>(
  "Reset flows table state"
);

export const toggleFlowsTableMode = createAction<void>(
  "Toggle flows table mode"
);

export const toggleFlowsGroupBy = createAsyncAction({
  name: "Toggle flows group by",
  action: async (
    groupByOption: keyof typeof GROUP_BY_OPTIONS,
    { dispatch, getState }
  ) => {
    const state = getState();
    let flowsGroupBy = [...getFlowsTableGroupByOptionsFromQueryParams(state)];
    if (flowsGroupBy.indexOf(groupByOption) === -1) {
      if (groupByOption === "unaggregatedFlows") {
        flowsGroupBy = ["unaggregatedFlows"];
      } else {
        flowsGroupBy.push(groupByOption);
      }
    } else {
      flowsGroupBy = flowsGroupBy.filter(group => group != groupByOption);
    }
    dispatch(pushAppUrl({ flowsGroupBy }));
  }
});

export const clearFlowsGroupBy = createAsyncAction({
  name: "Clear flows group by",
  action: async (args, { dispatch, getState }) => {
    dispatch(pushAppUrl({ flowsGroupBy: [] }));
  }
});

interface GetFlowsActionArgs {
  readonly mode: "append" | "prepend" | "replace";
  readonly first?: number;
  readonly after?: string | null;
  readonly last?: number;
  readonly before?: string | null;
  readonly filterBy?: FlowFiltersInput;
  readonly updateChart: boolean;
  readonly resetChartData: boolean;
}
export const fetchFlows = createAsyncAction({
  name: "Get Flows",
  takeLatest: true,
  action: async (
    args: GetFlowsActionArgs,
    { dispatch, client, getState }
  ): Promise<FlowConnection> => {
    const request = async (query: any) => {
      type ResultType = GqlResult<{ flows: FlowConnection }>;
      const { data } = await client.query<ResultType>(query);
      return data.viewer.flows;
    };

    const groupBy = getFlowsTableGroupByOptionsFromQueryParams(getState());

    let flows: FlowConnection | null = null;
    const { unaggregatedFlows = false, ...flowsGroupBy } = groupBy.reduce<
      Partial<typeof GROUP_BY_OPTIONS>
    >((accum, key) => {
      accum[key] = true;
      return accum;
    }, {});
    if (args.mode === "replace" || args.mode === "append") {
      flows = await request({
        query: queries.getFlows,
        variables: {
          first: args.first,
          after: args.after,
          filterBy: args.filterBy,
          unaggregated: unaggregatedFlows,
          ...flowsGroupBy
        }
      });
    } else {
      flows = await request({
        query: queries.getFlows,
        variables: {
          last: args.last,
          before: args.before,
          filterBy: args.filterBy,
          ...flowsGroupBy
        }
      });
    }

    return flows;
  },
  flushErrorMessage: args => `Failed to get flows`
});
