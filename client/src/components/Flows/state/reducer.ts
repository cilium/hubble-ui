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
import { uniqBy } from "lodash";
import { Action } from "src/state/createAction";
import { changeAppUrlState } from "../../Routing/state/actions";
import { COLUMN_SYMBOL } from "../columns/types";
import {
  fetchFlows,
  resetFlowsTableState,
  toggleColumnVisibility,
  toggleFlowsAutoRefresh,
  toggleFlowsTableMode,
  toggleFlowToPolicy
} from "./actions";
import { State } from "./types";

const COLUMNS_VISIBILITY_LS_KEY = "v3-flows-table-columns-visibility";
const loadColumnsVisibility = () => {
  const json = localStorage.getItem(COLUMNS_VISIBILITY_LS_KEY);
  if (json) {
    return JSON.parse(json);
  } else {
    return {
      [COLUMN_SYMBOL.SRC_POD_NAME]: true,
      [COLUMN_SYMBOL.SRC_ENDPOINT]: true,
      [COLUMN_SYMBOL.DST_POD_NAME]: true,
      [COLUMN_SYMBOL.DST_ENDPOINT]: true,
      [COLUMN_SYMBOL.DST_IP]: true,
      [COLUMN_SYMBOL.DST_PROTOCOL]: true,
      [COLUMN_SYMBOL.DST_FUNCTION]: true,
      [COLUMN_SYMBOL.FORWARDING_STATUS]: true,
      [COLUMN_SYMBOL.LAST_SEEN]: true
    };
  }
};

const writeColumnsVisibility = (data: { [key in COLUMN_SYMBOL]: boolean }) => {
  localStorage.setItem(COLUMNS_VISIBILITY_LS_KEY, JSON.stringify(data));
};

const initialState: State = {
  autoRefesh: true,
  connection: null,
  loading: "no",
  loadingChart: false,
  columnsVisibility: loadColumnsVisibility(),
  flowsToPolicy: {},
  flowsTableMode: "view"
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case toggleFlowToPolicy.type: {
      const { payload } = action as typeof toggleFlowToPolicy.actionType;
      const nextFlowsToPolicy = { ...state.flowsToPolicy };
      if (nextFlowsToPolicy[payload.id]) {
        delete nextFlowsToPolicy[payload.id];
      } else {
        nextFlowsToPolicy[payload.id] = payload;
      }
      return {
        ...state,
        flowsToPolicy: nextFlowsToPolicy
      };
    }
    case toggleFlowsTableMode.type: {
      return {
        ...state,
        flowsTableMode: state.flowsTableMode === "view" ? "edit" : "view",
        flowsToPolicy: {}
      };
    }
    case toggleFlowsAutoRefresh.type: {
      return {
        ...state,
        autoRefesh: !state.autoRefesh
      };
    }
    case toggleColumnVisibility.type: {
      const { payload } = action as typeof toggleColumnVisibility.actionType;
      const nextColumnsVisibility = {
        ...state.columnsVisibility,
        [payload]: !state.columnsVisibility[payload]
      };
      writeColumnsVisibility(nextColumnsVisibility);
      return {
        ...state,
        columnsVisibility: nextColumnsVisibility
      };
    }
    case fetchFlows.start.type: {
      const { args } = action as typeof fetchFlows.start.actionType;
      const connection = args.mode === "replace" ? null : state.connection;
      return {
        ...state,
        connection,
        flowsToPolicy: args.mode === "replace" ? {} : state.flowsToPolicy,
        flowsTableMode: args.mode === "replace" ? "view" : state.flowsTableMode,
        loading: args.mode
      };
    }
    case fetchFlows.ok.type: {
      const {
        args,
        payload: connetion
      } = action as typeof fetchFlows.ok.actionType;
      if (state.connection === null || args.mode === "replace") {
        return {
          ...state,
          connection: connetion,
          loading: "no"
        };
      } else if (args.mode === "append") {
        const emptyState = state.connection.edges.length === 0;
        const emptyResponse = connetion.edges.length === 0;
        let endCursor = connetion.pageInfo.endCursor;
        if (!endCursor && !emptyState) {
          endCursor = state.connection.pageInfo.endCursor;
        }
        let newEdges = [...state.connection.edges, ...connetion.edges];
        newEdges = uniqBy(newEdges, edge => edge.node.hash);
        const nextConnection = {
          ...state.connection,
          pageInfo: {
            ...state.connection.pageInfo,
            hasNextPage: connetion.pageInfo.hasNextPage,
            hasPreviousPage: state.connection.pageInfo.hasPreviousPage,
            startCursor: state.connection.pageInfo.startCursor,
            endCursor: endCursor
          },
          edges: emptyResponse ? state.connection.edges : newEdges
        };
        return {
          ...state,
          loading: "no",
          connection: nextConnection
        };
      } else if (args.mode === "prepend") {
        const emptyState = state.connection.edges.length === 0;
        const emptyResponse = connetion.edges.length === 0;
        let startCursor = connetion.pageInfo.startCursor;
        if (!startCursor && !emptyState) {
          startCursor = state.connection.pageInfo.startCursor;
        }
        let newEdges = [...connetion.edges, ...state.connection.edges];
        newEdges = uniqBy(newEdges, edge => edge.node.hash);
        const nextConnection = {
          ...state.connection,
          pageInfo: {
            ...state.connection.pageInfo,
            hasNextPage: state.connection.pageInfo.hasNextPage,
            hasPreviousPage: connetion.pageInfo.hasPreviousPage,
            startCursor: startCursor,
            endCursor: state.connection.pageInfo.endCursor
          },
          edges: emptyResponse ? state.connection.edges : newEdges
        };
        return {
          ...state,
          loading: "no",
          connection: nextConnection
        };
      }
      return {
        ...state,
        loading: "no"
      };
    }
    case fetchFlows.error.type: {
      return {
        ...state,
        loading: "no"
      };
    }
    case resetFlowsTableState.type: {
      return {
        ...state,
        connection: null,
        loading: "no",
        flowsToPolicy: {},
        flowsTableMode: "view"
      };
    }
    case changeAppUrlState.type: {
      const { payload } = action as typeof changeAppUrlState.actionType;
      const { prevUrlState, nextUrlState } = payload;
      if (
        prevUrlState.flowsStartDate !== nextUrlState.flowsStartDate ||
        prevUrlState.flowsEndDate !== nextUrlState.flowsEndDate
      ) {
        return {
          ...state,
          connection: null,
          loading: "no",
          autoRefesh: false,
          loadingChart: false,
          flowsToPolicy: {},
          flowsTableMode: "view"
        };
      }

      return state;
    }
    default: {
      return state;
    }
  }
};
