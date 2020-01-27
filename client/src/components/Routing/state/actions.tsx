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
import { push, replace } from "connected-react-router";
import { createAction, Dispatch, GetState } from "../../../state";
import {
  getAppAdvancedViewTypeFromParams,
  getClusterIdFromParams,
  getEndpointQueryFromParams,
  getFlowQueryFromParams,
  getFlowsEndDateFromParams,
  getFlowsEventsChartFromQueryParams,
  getFlowsFilterInputRouteState,
  getFlowsFilterTypeFromQueryParams,
  getFlowsForwardingStatusRouteState,
  getFlowsGroupBySourceNamespaceFromQueryParams,
  getFlowsHttpStatusCodeQueryParams,
  getFlowsRejectedReasonsFromQueryParams,
  getFlowsStartDateFromParams,
  getFlowsTableGroupByOptionsFromQueryParams,
  getFunctionQueryFromParams,
  getNamespaceStringFromParams,
  getProtocolQueryFromParams
} from "./selectors";
import { UrlState, UrlStateMeta } from "./types";
import { buildUrlFromState } from "./utils";

export const appUrlStateMeta: UrlStateMeta = {
  needRecenterMap: false
};

export const pushAppUrl = (newUrlState: UrlState, meta?: UrlStateMeta) => (
  dispatch: Dispatch,
  getState: GetState
) => changeAppUrl(push, dispatch, getState, newUrlState, meta);

export const replaceAppUrl = (newUrlState: UrlState, meta?: UrlStateMeta) => (
  dispatch: Dispatch,
  getState: GetState
) => changeAppUrl(replace, dispatch, getState, newUrlState, meta);

export const changeAppUrlState = createAction<{
  prevUrlState: UrlState;
  nextUrlState: UrlState;
}>("Change app url state");

const changeAppUrl = (
  method: typeof push | typeof replace,
  dispatch: Dispatch,
  getState: GetState,
  partUrlState: UrlState,
  meta?: UrlStateMeta
) => {
  if (meta) {
    appUrlStateMeta.needRecenterMap = meta.needRecenterMap;
  }
  const state = getState();
  const prevUrlState: UrlState = {
    appAdvancedViewType: getAppAdvancedViewTypeFromParams(state),
    endpointsQuery: getEndpointQueryFromParams(state),
    protocolsQuery: getProtocolQueryFromParams(state),
    functionsQuery: getFunctionQueryFromParams(state),
    flowsQuery: getFlowQueryFromParams(state),
    flowsStartDate: getFlowsStartDateFromParams(state),
    flowsEndDate: getFlowsEndDateFromParams(state),
    flowsForwardingStatus: getFlowsForwardingStatusRouteState(state),
    flowsFilterInput: getFlowsFilterInputRouteState(state),
    flowsGroupBy: getFlowsTableGroupByOptionsFromQueryParams(state),
    flowsGroupBySourceNamespace: getFlowsGroupBySourceNamespaceFromQueryParams(
      state
    ),
    flowsFilterType: getFlowsFilterTypeFromQueryParams(state),
    flowsEventsChart: getFlowsEventsChartFromQueryParams(state),
    flowsRejectedReasons: getFlowsRejectedReasonsFromQueryParams(state),
    flowsHttpStatusCode: getFlowsHttpStatusCodeQueryParams(state),
    clusterId: getClusterIdFromParams(state),
    namespaces: getNamespaceStringFromParams(state)
  };
  let nextUrlState = {
    ...prevUrlState,
    ...partUrlState
  };
  const url = buildUrlFromState(nextUrlState);
  if (!url) {
    throw new Error("Wrong url");
  }

  const next = () => {
    dispatch(
      changeAppUrlState({
        prevUrlState,
        nextUrlState
      })
    );
    dispatch(method(url));
  };

  next();
};
