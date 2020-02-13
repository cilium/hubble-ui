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
import { uniq, uniqBy } from "lodash";
import { getEndpointHash } from "src/shared/generators";
import { RootState } from "src/state/rootReducer";
import { AppEndpoint, AppFunction, Protocol } from "../../../graphqlTypes";
import { createCachedSelector, createSelector } from "../../../state";
import {
  getClusterDiscoveryEndpoints,
  getClusterDiscoveryResult,
  getClusters
} from "../../Clusters/state/selectors";
import { Boundary, MapFilters } from "../../MapView/state/types";
import { createGraph } from "../../MapView/utils/graphs";
import {
  getEndpointIdFromParams,
  getEndpointQueryObjectFromParams,
  getFunctionQueryFromParams,
  getNamespacesFromParams,
  getProtocolQueryFromParams
} from "../../Routing/state/selectors";
import { hasEndpointFilter } from "../../Routing/state/utils";
import {
  endpointsNamesShortener,
  getEndpointNamespace,
  isWorldOrHostEndpoint
} from "../utils";

export const getScreenDimensions = (state: RootState) =>
  state.newapp.screen.dimensions;

export const getDiscoveryMinsAgo = (state: RootState) =>
  state.newapp.discoveryMinsAgo;

export const getMapPanelPosition = (state: RootState) => {
  return state.newapp.mapPanelPosition;
};

export const getNextDiscoveryTime = (state: RootState) => {
  return state.newapp.nextDiscoveryTime;
};

export const getEndpoints = createSelector(
  getClusterDiscoveryEndpoints,
  clusterDiscoveryEndpoints => {
    let endpoints: AppEndpoint[] = [];
    endpoints = clusterDiscoveryEndpoints;
    return sortEndpoints(
      uniqBy(
        [...endpoints],
        endpoint => `${endpoint.id}:${getEndpointNamespace(endpoint)}`
      )
    );
  }
);

export const getCurrentEndpoint = createSelector(
  getEndpoints,
  getEndpointIdFromParams,
  (endpoints, endpointIdFromParams) => {
    const endpoint = endpoints.find(
      endpoint => endpoint.id === endpointIdFromParams
    );
    return endpoint ? endpoint : null;
  }
);

export const getCurrentEndpointId = createSelector(
  getCurrentEndpoint,
  endpoint => (endpoint ? endpoint.id : null)
);

export const getEndpointProtocols = createSelector(
  getCurrentEndpoint,
  endpoint => (endpoint ? endpoint.protocols : [])
);

export const getCurrentProtocol = createSelector(
  getEndpointProtocols,
  getProtocolQueryFromParams,
  (protocols, protocolIdFromParams) => {
    if (!protocolIdFromParams) {
      const firstProtocol = protocols[0];
      return firstProtocol ? firstProtocol : null;
    }
    const protocol = protocols.find(
      protocol => protocol.id === protocolIdFromParams
    );
    return protocol ? protocol : null;
  }
);

export const getCurrentProtocolId = createSelector(
  getCurrentProtocol,
  protocol => (protocol ? protocol.id : null)
);

export const getProtocolAllowedSources = createSelector(
  getCurrentProtocol,
  protocol => (protocol ? protocol.allowedSources : [])
);

export const getProtocolMappedAllowedSources = createSelector(
  getEndpoints,
  getProtocolAllowedSources,
  (endpoints, sources) => mapSources(endpoints, sources)
);

export const getProtocolFunctions = createSelector(
  getCurrentProtocol,
  protocol => (protocol && protocol.functions ? protocol.functions : [])
);

export const getClustersMappedForDiscovery = createSelector(
  getClusters,
  clusters => clusters.map(cluster => ({ cluster }))
);

export const getCurrentFunction = createSelector(
  getProtocolFunctions,
  getFunctionQueryFromParams,
  (functions, functionIdFromParams) => {
    if (!functionIdFromParams) {
      return null;
    }
    const func = functions.find(func => func.id === functionIdFromParams);
    return func ? func : null;
  }
);

export const getCurrentFunctionId = createSelector(getCurrentFunction, func =>
  func ? func.id : null
);

export const getFunctionAllowedSources = createSelector(
  getCurrentFunction,
  func => (func ? func.allowedSources : [])
);

export const getFunctionMappedAllowedSources = createSelector(
  getEndpoints,
  getFunctionAllowedSources,
  (endpoints, sources) => mapSources(endpoints, sources)
);

const mapSources = (endpoints: AppEndpoint[], sources: string[]) => {
  if (endpoints.length === 0) {
    return [];
  }
  const mappedSources = sources.map(source =>
    endpoints.find(endpoint => source === endpoint.id)
  );
  const filteredSources = mappedSources.filter(endpoint => Boolean(endpoint));
  return filteredSources as AppEndpoint[];
};

export const getShowIngressTraffic = (state: RootState) => {
  return state.map.showIngressTraffic;
};

export const getShowEgressTraffic = (state: RootState) => {
  return state.map.showEgressTraffic;
};

export const getShowIntraAppTraffic = (state: RootState) => {
  return state.map.showIntraAppTraffic;
};

export const getShowL7Traffic = (state: RootState) => {
  return state.map.showL7Traffic;
};

export const getAggregateIngressFlows_Source = (state: RootState) => {
  return state.map.aggregateIngressFlows;
};

export const getAggregateEgressFlows_Source = (state: RootState) => {
  return state.map.aggregateEgressFlows;
};
export const getShowHostEndpoint = (state: RootState) => {
  return state.map.showHostEndpoint;
};

export const getShowWorldEndpoint = (state: RootState) => {
  return state.map.showWorldEndpoint;
};

export const getShowKubeDnsEndpoint = (state: RootState) => {
  return state.map.showKubeDns;
};

export const getAggregateIngressFlows = createSelector(
  getAggregateIngressFlows_Source,
  getEndpointQueryObjectFromParams,
  (aggregateIngressFlows, endpointFilter) => {
    if (hasEndpointFilter(endpointFilter)) {
      return false;
    }
    return aggregateIngressFlows;
  }
);

export const getAggregateEgressFlows = createSelector(
  getAggregateEgressFlows_Source,
  getEndpointQueryObjectFromParams,
  (aggregateEgressFlows, endpointFilter) => {
    if (hasEndpointFilter(endpointFilter)) {
      return false;
    }
    return aggregateEgressFlows;
  }
);

export const getMapFilters = createSelector(
  getShowIngressTraffic,
  getShowEgressTraffic,
  getShowIntraAppTraffic,
  getShowL7Traffic,
  getAggregateIngressFlows,
  getAggregateEgressFlows,
  getShowHostEndpoint,
  getShowWorldEndpoint,
  getShowKubeDnsEndpoint,
  (
    showIngressTraffic,
    showEgressTraffic,
    showIntraAppTraffic,
    showL7Traffic,
    aggregateIngressFlows,
    aggregateEgressFlows,
    showHostEndpoint,
    showWorldEndpoint,
    showKubeDns
  ): MapFilters => ({
    showIngressTraffic,
    showEgressTraffic,
    showIntraAppTraffic,
    showL7Traffic,
    aggregateIngressFlows,
    aggregateEgressFlows,
    showHostEndpoint,
    showWorldEndpoint,
    showKubeDns
  })
);

export const getGraphData = createSelector(
  getNamespacesFromParams,
  getClusterDiscoveryResult,
  getEndpointQueryObjectFromParams,
  getMapFilters,
  (
    namespacesFromParams,
    clusterDiscoveryResult,
    endpointsFilter,
    mapFilters
  ) => {
    if (clusterDiscoveryResult) {
      const boundaries: Boundary[] = namespacesFromParams.map<Boundary>(
        namespace => ({
          type: "namespace",
          title: namespace
        })
      );
      return createGraph(
        clusterDiscoveryResult.endpoints,
        endpointsFilter,
        "hidden",
        mapFilters,
        boundaries
      );
    } else {
      return null;
    }
  }
);

export const getGraphSnapshot = createSelector(getGraphData, graphData => {
  return graphData ? JSON.stringify(graphData.graph) : null;
});

export const getGraphMeta = createSelector(getGraphData, graphData => {
  return graphData ? graphData.meta : null;
});

export const getGraphBoundaries = createSelector(getGraphMeta, graphMeta => {
  return graphMeta ? graphMeta.boundaries : null;
});

export const getEndpointVisibleMode = createCachedSelector(
  getGraphData,
  (state, endpoint: AppEndpoint) => endpoint,
  (graphData, endpoint) => {
    if (!graphData) {
      return "visible";
    }
    return graphData.graph[endpoint.id].visibleMode;
  }
)((state, endpoint) => endpoint.id);

export const isFlowVisibleMode = (
  state: RootState,
  fromEndpoint: AppEndpoint,
  toEndpoint: AppEndpoint
) => {
  const fromEndpointHighlighted = getEndpointVisibleMode(state, fromEndpoint);
  const toEndpointHighlighted = getEndpointVisibleMode(state, toEndpoint);
  return fromEndpointHighlighted || toEndpointHighlighted;
};

export const getHasEndpoints = createSelector(getEndpoints, endpoints => {
  return endpoints.length > 0;
});

export const getEndpointsMap = createSelector(getEndpoints, endpoints => {
  const map: { [key: string]: AppEndpoint } = {};
  endpoints.forEach(endpoint => {
    map[endpoint.id] = endpoint;
  });
  return map;
});

export const getEndpointsMapWithLabelsHashAsKey = createSelector(
  getEndpoints,
  endpoints => {
    const map: { [key: string]: AppEndpoint } = {};
    endpoints.forEach(endpoint => {
      map[getEndpointHash(endpoint.labels)] = endpoint;
    });
    return map;
  }
);

export const getEndpointsIds = createSelector(getEndpoints, endpoints =>
  endpoints.map(({ id }) => id)
);

export const getWorldEndpointsIds = createSelector(getEndpoints, endpoints =>
  endpoints
    .filter(endpoint => isWorldOrHostEndpoint(endpoint))
    .map(({ id }) => id)
);

export const getEndpointById = createCachedSelector(
  getEndpoints,
  (state, endpointId: string) => endpointId,
  (endpoints, endpointId) => {
    const endpoint = endpoints.find(({ id }) => id === endpointId);
    return endpoint ? endpoint : null;
  }
)((state, endpointId) => endpointId);

export const getProtocolById = createCachedSelector(
  getEndpoints,
  (state, protocolId: string) => protocolId,
  (endpoints, protocolId) => {
    const endpointsCount = endpoints.length;
    for (let i = 0; i < endpointsCount; i += 1) {
      const endpoint = endpoints[i];
      const { protocols } = endpoint;
      const protocolsCount = protocols.length;
      for (let j = 0; j < protocolsCount; j += 1) {
        const protocol = protocols[j];
        if (protocol.id === protocolId) {
          return {
            protocol,
            endpoint
          };
        }
      }
    }
    return null;
  }
)((state, protocolId) => protocolId);

export const getProtocolsWithParents = createSelector(
  getEndpoints,
  endpoints => {
    const map: {
      [key: string]: {
        readonly endpoint: AppEndpoint;
        readonly protocol: Protocol;
      };
    } = {};
    const endpointsCount = endpoints.length;
    for (let i = 0; i < endpointsCount; i += 1) {
      const endpoint = endpoints[i];
      const { protocols } = endpoint;
      const protocolsCount = protocols.length;
      for (let j = 0; j < protocolsCount; j += 1) {
        const protocol = protocols[j];
        map[protocol.id] = {
          endpoint,
          protocol
        };
      }
    }

    return map;
  }
);

export const getFunctionsWithParents = createSelector(
  getProtocolsWithParents,
  protocolsWithParents => {
    const map: {
      [key: string]: {
        readonly func: AppFunction;
        readonly endpoint: AppEndpoint;
        readonly protocol: Protocol;
      };
    } = {};
    Object.keys(protocolsWithParents).forEach(pid => {
      const protocolWithParent = protocolsWithParents[pid];
      (protocolWithParent.protocol.functions || []).forEach(func => {
        map[func.id] = {
          ...protocolWithParent,
          func
        };
      });
    });
    return map;
  }
);

export const getFunctionWithParentsById = createCachedSelector(
  getFunctionsWithParents,
  (state, functionId: string) => functionId,
  (functionsMap, functionId) => {
    const func = functionsMap[functionId];
    return func ? func : null;
  }
)((state, functionId) => functionId);

export const getProtocolMappedGroupedFunctions = createSelector(
  getGraphData,
  getCurrentEndpoint,
  getCurrentProtocol,
  getProtocolFunctions,
  (graphData, endpoint, protocol, protocolFunctions) => {
    if (!graphData || !endpoint || !protocol) {
      return [];
    }
    const protocolIndex = endpoint.protocols.findIndex(
      ({ id }) => id === protocol.id
    );
    const protocolGroup =
      graphData.graph[endpoint.id].protocolsFunctionsGroups[protocolIndex];
    return protocolGroup.functionsGroups.map(({ groupTitle, functions }) => ({
      groupTitle,
      functions: functions.map(
        ({ functionIndex }) => protocolFunctions[functionIndex]
      )
    }));
  }
);

export const getNamespacesFromEndpoints = createSelector(
  getEndpoints,
  endpoints =>
    uniq(
      endpoints.reduce<string[]>(
        (namespaces, { labels }) =>
          namespaces.concat(
            labels
              .filter(({ key }) => key === "k8s:io.kubernetes.pod.namespace")
              .map(({ value }) => value)
          ),
        []
      )
    )
);

export const getEndpointsNamesShortands = createSelector(
  getEndpoints,
  endpoints => endpointsNamesShortener(endpoints)
);

export const getShortandEndpointName = createCachedSelector(
  getEndpointsNamesShortands,
  (state: RootState, endpointName: string) => endpointName,
  (shortands, endpointName) => {
    if (!shortands[endpointName] || endpointName.length <= 20) {
      return endpointName;
    }
    return endpointName;
    // const lcs = shortands[endpointName];
    // return lcs.substr(0, 4) + endpointName.replace(lcs, "…");
  }
)((state, endpointName) => endpointName);

const sortEndpoints = (endpoints: AppEndpoint[]) =>
  endpoints.sort((a, b) => {
    if (a.name && b.name) {
      return a.name.localeCompare(b.name);
    } else if (a.name && !b.name) {
      return 1;
    } else if (!a.name && b.name) {
      return -1;
    } else {
      const an = getEndpointNamespace(a);
      const bn = getEndpointNamespace(b);
      return an.localeCompare(bn);
    }
  });
