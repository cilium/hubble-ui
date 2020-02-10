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
import { changeAppUrlState } from "src/components/Routing/state/actions";
import { Action } from "src/state/createAction";
import { mergeEndpoints } from "src/utils/mergers";
import {
  discoverCluster,
  fetchCluster,
  fetchClusters,
  getClusterUnmanagedPods
} from "./actions";
import { State } from "./types";
import { mergeFetchedClusterDataIntoState } from "./utils";

const initialState: State = {
  fetching: false,
  fetchedOkAtLeastOnce: false,
  clusters: [],
  discoveryResult: null,
  discovering: false
};

export const reducer = (state = initialState, action: Action): State => {
  switch (action.type) {
    case fetchClusters.start.type: {
      return {
        ...state,
        fetching: true
      };
    }
    case fetchClusters.ok.type: {
      const { payload } = action as typeof fetchClusters.ok.actionType;

      const clusters = payload.map(cluster => ({
        ...state.clusters.find(({ id }) => cluster.id === id),
        ...cluster
      }));

      return {
        ...state,
        clusters,
        fetching: false,
        fetchedOkAtLeastOnce: true
      };
    }
    case fetchClusters.error.type: {
      return {
        ...state,
        fetching: false
      };
    }
    case getClusterUnmanagedPods.ok.type:
    case fetchCluster.ok.type: {
      const { payload } = action as
        | typeof getClusterUnmanagedPods.ok.actionType
        | typeof fetchCluster.ok.actionType;
      if (!payload) {
        return state;
      }
      return mergeFetchedClusterDataIntoState(payload, state);
    }
    case discoverCluster.start.type: {
      return {
        ...state,
        discovering: true
      };
    }
    case discoverCluster.error.type: {
      return {
        ...state,
        discovering: false
      };
    }
    case discoverCluster.ok.type: {
      const { payload } = action as typeof discoverCluster.ok.actionType;
      if (
        state.discoveryResult &&
        state.discoveryResult.responseHash === payload.responseHash
      ) {
        return {
          ...state,
          discoveryResult: {
            ...state.discoveryResult,
            responseTimestamp: payload.responseTimestamp
          },
          discovering: false
        };
      }

      const stateEndpoints = state.discoveryResult
        ? state.discoveryResult.endpoints
        : [];
      const concatedEndpoints = stateEndpoints.concat(payload.endpoints);
      const uniqEndpoints = uniqBy(concatedEndpoints, endpoint => endpoint.id);
      const updatedEndpoints = mergeEndpoints(
        uniqEndpoints,
        payload.endpoints,
        {},
        {},
        true
      );

      return {
        ...state,
        discoveryResult: {
          ...payload,
          endpoints: updatedEndpoints
        },
        discovering: false
      };
    }
    case changeAppUrlState.type: {
      const { payload } = action as typeof changeAppUrlState.actionType;
      const { prevUrlState, nextUrlState } = payload;

      const clusterIdChanged = Boolean(
        prevUrlState.clusterId !== nextUrlState.clusterId
      );

      const namespacesChanged = Boolean(
        prevUrlState.namespaces !== nextUrlState.namespaces
      );

      if (clusterIdChanged || namespacesChanged) {
        return {
          ...state,
          discoveryResult: null
        };
      }
      return state;
    }
    default: {
      return state;
    }
  }
};
