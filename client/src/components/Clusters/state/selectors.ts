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
import { getClusterIdFromParams } from "src/components/Routing/state/selectors";
import { RootState } from "src/state/rootReducer";
import { Cluster } from "../../../graphqlTypes";
import { createCachedSelector, createSelector } from "../../../state";
import { ClusterWithSelected } from "./types";
import { isClusterLive } from "./utils";

export const getClusters = (state: RootState) => {
  return state.clusters.clusters.sort((a, b) => {
    const aSynced = isClusterLive(a);
    const bSynced = isClusterLive(b);
    if (aSynced && !bSynced) {
      return -1;
    } else if (!aSynced && bSynced) {
      return 1;
    }
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
};

export const getClustersFetchedOkAtLeastOnce = (state: RootState) => {
  return state.clusters.fetchedOkAtLeastOnce;
};

export const getClustersFetching = (state: RootState) => {
  return state.clusters.fetching;
};

export const getClusterDiscoveryResult = (state: RootState) => {
  return state.clusters.discoveryResult;
};

export const getClusterDiscoveryEndpoints = createSelector(
  getClusterDiscoveryResult,
  result => (result ? result.endpoints : [])
);

export const getClusterDiscoveryTimestamp = createSelector(
  getClusterDiscoveryResult,
  result => (result ? result.responseTimestamp : null)
);

export const getClusterDiscovering = (state: RootState) => {
  return state.clusters.discovering;
};

export const getClustersListMappedWithSelected = createSelector(
  getClusters,
  getClusterIdFromParams,
  (clusters, clusterIdFromParams): null | ClusterWithSelected[] => {
    return clusters
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      .map(cluster => ({
        cluster,
        selected: cluster.id === clusterIdFromParams
      }));
  }
);

export const getClustersMap = createSelector(getClusters, clusters => {
  const map: { [key: string]: Cluster } = {};
  clusters.forEach(cluster => {
    map[cluster.id] = cluster;
  });
  return map;
});

export const getClustersIds = createSelector(getClusters, clusters =>
  clusters.map(({ id }) => id)
);

export const getClusterById = createCachedSelector(
  getClustersMap,
  (state: RootState, clusterId: string) => clusterId,
  (clustersMap, clusterId) => {
    const cluster = clustersMap[clusterId];
    return cluster ? cluster : null;
  }
)((state, clusterId) => clusterId);

export const getClusterByName = createCachedSelector(
  getClusters,
  (state: RootState, clusterName: string) => clusterName,
  (clusters, clusterName) => {
    const cluster = clusters.find(({ name }) => name === clusterName);
    return cluster ? cluster : null;
  }
)((state, clusterName) => clusterName);

export const getClusterNameById = createCachedSelector(
  getClustersMap,
  (state: RootState, clusterId: string) => clusterId,
  (clustersMap, clusterId) => {
    const cluster = clustersMap[clusterId];
    return cluster ? cluster.name : null;
  }
)((state, clusterId) => clusterId);

export const getClusterNamespacesById = createCachedSelector(
  getClustersMap,
  (state: RootState, clusterId: string) => clusterId,
  (clustersMap, clusterId) => {
    const cluster = clustersMap[clusterId];
    return cluster ? cluster.namespaces : null;
  }
)((state, clusterId) => clusterId);

export const getClusterPoliciesById = createCachedSelector(
  getClustersMap,
  (state: RootState, clusterId: string) => clusterId,
  (clustersMap, clusterId) => {
    const cluster = clustersMap[clusterId];
    if (!cluster || !cluster.status) {
      return null;
    }
    return cluster.status.ciliumNetworkPolicies.sort((a, b) => {
      const namespace = a.namespace
        .toLowerCase()
        .localeCompare(b.namespace.toLowerCase());
      if (namespace !== 0) {
        return namespace;
      }
      const host = a.hostname
        .toLowerCase()
        .localeCompare(b.hostname.toLowerCase());
      if (host !== 0) {
        return host;
      }
      return a.name && b.name
        ? a.name!.toLowerCase().localeCompare(b.name!.toLowerCase())
        : 0;
    });
  }
)((state, clusterId) => clusterId);

export const getClusterPodsById = createCachedSelector(
  getClustersMap,
  (state: RootState, clusterId: string) => clusterId,
  (clustersMap, clusterId) => {
    const cluster = clustersMap[clusterId];
    if (!cluster || !cluster.status) {
      return null;
    }
    return cluster ? cluster.status.pods : null;
  }
)((state, clusterId) => clusterId);

export const getClusterUnmanagedPodsById = createCachedSelector(
  getClustersMap,
  (state: RootState, clusterId: string) => clusterId,
  (clustersMap, clusterId) => {
    const cluster = clustersMap[clusterId];
    if (!cluster || !Object.keys(cluster).includes("unmanagedPods")) {
      return undefined;
    } else {
      return cluster.unmanagedPods;
    }
  }
)((state, clusterId) => clusterId);

export const getClusterCiliumNetworkPolicies = createCachedSelector(
  getClustersMap,
  (state: RootState, clusterId: string) => clusterId,
  (clustersMap, clusterId) => {
    const { cnp } = clustersMap[clusterId];

    if (cnp) {
      return cnp;
    }

    return null;
  }
)((state, clusterId) => clusterId);
