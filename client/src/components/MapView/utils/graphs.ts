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
import { hasEndpointFilter } from "src/components/Routing/state/utils";
import { findNamespaceFromLabels } from "src/shared/finders";
import { AppEndpoint, AppFunction, Protocol } from "../../../graphqlTypes";
import {
  getExtraLabels,
  HTTP_STATUS_MESSAGES,
  isBottomNode,
  isHostEndpoint,
  isInAppEndpoint,
  isIngressNode,
  isLeftNode,
  isTopNode,
  isWorldEndpoint,
  VisibleModeMapping
} from "../../App/utils";
import { ConnectionsMap } from "../../MapView/state/types";
import { EndpointQueryObject } from "../../Routing/state/selectors";
import {
  Boundary,
  BoundaryWithCoords,
  FunctionGroup,
  FunctionsGroups,
  Graph,
  GraphMeta,
  Levels,
  LevelsHeights,
  MapFilters,
  Node,
  ProtocolGroup
} from "../state/types";
import {
  FUNCTION_HEIGHT,
  FUNCTION_H_PADDING,
  H_PADDING,
  INGRESS_EGRESS_HEIGHT,
  LABELS_V_PADDINGS,
  LABEL_BOTTOM_MARGIN,
  LABEL_HEIGHT,
  MAP_H_PADDING,
  MAP_V_PADDING,
  NODE_HEADER_HEIGHT,
  NODE_WIDTH,
  OUTER_POINT_PADDING,
  PROTOCOL_HEADER_HEIGHT,
  V_PADDING
} from "./constants";
import { distBetweenPoints } from "./geometry";

const MORE_FUNCTIONS_THRESHOLD = 5;

interface Context {
  readonly endpointsFilter: EndpointQueryObject;
  readonly visibleMode: "hidden" | "fogged";
  readonly mapFilters: MapFilters;
  readonly connectionsMap: ReturnType<typeof buildConnectionsMap>;
  readonly boundaries: Boundary[];
}

export const createGraph = (
  endpoints: AppEndpoint[],
  endpointsFilter: EndpointQueryObject,
  visibleMode: "hidden" | "fogged",
  mapFilters: MapFilters,
  boundaries: Boundary[]
): { graph: Graph; meta: GraphMeta } => {
  const ctx: Context = {
    endpointsFilter,
    visibleMode,
    mapFilters,
    connectionsMap: buildConnectionsMap(endpoints, endpointsFilter),
    boundaries
  };
  const initialGraph = buildInitialGraph(
    ctx,
    filterAndSortEndpoints(ctx, endpoints)
  );
  const graphMappedWithVisibleMode = mapGraphWithVisibleMode(
    ctx,
    initialGraph,
    endpointsFilter
  );
  const weightedGraph = updateNodesWeights(
    ctx,
    updateNodesWidthsHeights(graphMappedWithVisibleMode)
  );
  const { graph, width, height } = updateGraphGeometry(ctx, weightedGraph);
  const boundariesInfo = getBoundariesInfo(ctx.boundaries);
  return {
    graph: graph,
    meta: {
      graphWidth: width,
      graphHeight: height,
      boundaries: boundariesInfo.isAppBoundary
        ? calcAppBorderWithCoords(ctx, graph)
        : calcNamespacesBordersWithCoords(ctx, graph)
    }
  };
};

export const filterAndSortEndpoints = (
  ctx: Context,
  endpoints: AppEndpoint[]
) => {
  return endpoints
    .filter(endpoint => {
      const conn = ctx.connectionsMap.connections[endpoint.id];
      const { endpointsFilter, boundaries } = ctx;
      const emptyFilter = Boolean(
        (!endpointsFilter.from &&
          !endpointsFilter.to &&
          !endpointsFilter.self) ||
          boundaries.length === 0
      );
      if (conn.filtered || emptyFilter) {
        if (!ctx.mapFilters.showHostEndpoint && isHostEndpoint(endpoint)) {
          return false;
        }
        if (!ctx.mapFilters.showWorldEndpoint && isWorldEndpoint(endpoint)) {
          return false;
        }
        return true;
      } else if (isInAppEndpoint(endpoint)) {
        if (conn.to || conn.from) {
          return true;
        }
      } else {
        if (ctx.mapFilters.showEgressTraffic && conn.to) {
          return true;
        }
        if (ctx.mapFilters.showIngressTraffic && conn.from) {
          return true;
        }
      }
      return false;
    })
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
};

export const buildInitialGraph = (ctx: Context, endpoints: AppEndpoint[]) => {
  return endpoints.reduce<Graph>((acc, endpoint) => {
    let isFlowsFiltered = false;
    const protocolsFunctionsGroups = endpoint.protocols.map<ProtocolGroup>(
      (protocol, protocolIndex) => {
        const {
          visibleAllowedSources,
          functionsGroups,
          visibleFunctionsGroups,
          filteredFunctions
        } = mapProtocolFunctionsToProtocolFunctionsGroups(
          ctx,
          endpoint,
          protocol
        );
        isFlowsFiltered =
          isFlowsFiltered ||
          functionsGroups.some(group =>
            group.functions.some(({ filtered }) => filtered)
          );
        return {
          protocolIndex,
          visibleAllowedSources,
          functionsGroups,
          visibleFunctionsGroups,
          filteredFunctions
        };
      }
    );
    acc[endpoint.id] = {
      endpoint,
      protocolsFunctionsGroups,
      isFlowsFiltered,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      connection: ctx.connectionsMap.connections[endpoint.id],
      weight: undefined,
      connectors: {},
      functionsCoords: {},
      protocolsCoords: {},
      moreLabelsCoords: {},
      groupsCoords: {},
      visibleMode: "visible"
    };
    return acc;
  }, {});
};

export const mapGraphWithVisibleMode = (
  ctx: Context,
  graph: Graph,
  endpointsFilter: EndpointQueryObject
) => {
  const map: VisibleModeMapping = {
    mode: ctx.visibleMode,
    mapping: {}
  };
  let hasSomeSelectedEndpoints = false;
  if (endpointsFilter.from) {
    map.mapping[endpointsFilter.from] = false;
    hasSomeSelectedEndpoints = true;
  }
  if (endpointsFilter.to) {
    map.mapping[endpointsFilter.to] = false;
    hasSomeSelectedEndpoints = true;
  }
  if (endpointsFilter.self) {
    map.mapping[endpointsFilter.self] = false;
    hasSomeSelectedEndpoints = true;
  }
  forEachNode(graph, currentNode => {
    if (
      hasSomeSelectedEndpoints &&
      map.mapping[currentNode.endpoint.id] !== false
    ) {
      map.mapping[currentNode.endpoint.id] = true;
    }
    forEachAllowedNode(graph, currentNode, allowedNode => {
      if (endpointsFilter.self) {
        if (endpointsFilter.self === currentNode.endpoint.id) {
          map.mapping[allowedNode.endpoint.id] = false;
        } else if (endpointsFilter.self === allowedNode.endpoint.id) {
          map.mapping[currentNode.endpoint.id] = false;
        }
      } else if (endpointsFilter.from && endpointsFilter.to) {
        if (
          endpointsFilter.to === currentNode.endpoint.id &&
          endpointsFilter.from === allowedNode.endpoint.id
        ) {
          map.mapping[allowedNode.endpoint.id] = false;
          map.mapping[currentNode.endpoint.id] = false;
        }
      } else if (endpointsFilter.from || endpointsFilter.to) {
        if (endpointsFilter.to === currentNode.endpoint.id) {
          map.mapping[allowedNode.endpoint.id] = false;
        } else if (endpointsFilter.from === allowedNode.endpoint.id) {
          map.mapping[currentNode.endpoint.id] = false;
        }
      }
    });
  });
  return reduceGraph<Graph>(
    graph,
    (acc, node) => {
      acc[node.endpoint.id] = {
        ...node,
        visibleMode:
          map.mapping[node.endpoint.id] === true ? map.mode : "visible"
      };
      return acc;
    },
    graph
  );
};

export const reduceGraph = <T>(
  graph: Graph,
  reducer: (acc: T, node: Node) => T,
  initialValue = Object.assign({}, graph)
): T =>
  Object.keys(graph)
    .map(id => graph[id])
    .filter(node => {
      if (node.visibleMode === "hidden") {
        return false;
      }
      return Boolean(node);
    })
    .reduce<T>(reducer, initialValue as any);

export const forEachNode = (
  graph: Graph,
  visitor: (node: Node) => void,
  ctx?: Context
): void => {
  Object.keys(graph).forEach(id => {
    const node = graph[id];
    if (node) {
      if (node.visibleMode === "hidden") {
        return;
      } else if (ctx) {
        if (ctx.mapFilters.aggregateIngressFlows) {
          if (node.connection.type === "many-ingress-to-app") {
            return;
          }
        }
        if (ctx.mapFilters.aggregateEgressFlows) {
          if (node.connection.type === "many-egress-from-app") {
            return;
          }
        }
      }
      visitor(node);
    }
  });
};

export const forEachTopNode = (
  graph: Graph,
  visitor: (node: Node) => void
): void =>
  Object.keys(graph).forEach(id => {
    const node = graph[id];
    if (node && isTopNode(node)) {
      if (node.visibleMode === "hidden") {
        return;
      }
      visitor(node);
    }
  });

export const forEachBottomNode = (
  graph: Graph,
  visitor: (node: Node) => void
): void =>
  Object.keys(graph).forEach(id => {
    const node = graph[id];
    if (node && isBottomNode(node)) {
      if (node.visibleMode === "hidden") {
        return;
      }
      visitor(node);
    }
  });

export const forEachAllowedNode = (
  graph: Graph,
  node: Node,
  visitor: (node: Node) => void,
  ctx?: Context
): void => {
  if (!graph[node.endpoint.id]) return;
  if (graph[node.endpoint.id].visibleMode === "hidden") {
    return;
  }
  const visited: { [key: string]: boolean } = {};
  const visit = (allowedSource: string) => {
    if (visited[allowedSource]) return;
    visited[allowedSource] = true;
    const node = graph[allowedSource];
    if (node) {
      if (node.visibleMode === "hidden") {
        return;
      } else if (ctx) {
        if (ctx.mapFilters.aggregateIngressFlows) {
          if (node.connection.type === "many-ingress-to-app") {
            return;
          }
        }
        if (ctx.mapFilters.aggregateEgressFlows) {
          if (node.connection.type === "many-egress-from-app") {
            return;
          }
        }
      }
      visitor(node);
    }
  };
  node.protocolsFunctionsGroups.forEach(
    ({ visibleAllowedSources, visibleFunctionsGroups, filteredFunctions }) => {
      visibleAllowedSources.forEach(visit);
      filteredFunctions.forEach(func => func.allowedSources.forEach(visit));
      visibleFunctionsGroups.forEach(functionGroup =>
        functionGroup.functions.forEach(({ visibleAllowedSources }) =>
          visibleAllowedSources.forEach(visit)
        )
      );
    }
  );
};

const calcNumberOfAllowedNodes = (graph: Graph, node: Node) => {
  let cnt = 0;
  forEachAllowedNode(graph, node, () => cnt++);
  return cnt;
};

const traverseForWeight = (
  graph: Graph,
  node: Node,
  weight: number,
  visited: Set<string> = new Set()
) => {
  let totalWeight = weight;
  if (visited.has(node.endpoint.id)) {
    return totalWeight;
  }
  visited.add(node.endpoint.id);
  forEachAllowedNode(graph, node, allowedNode => {
    totalWeight = Math.min(
      traverseForWeight(graph, allowedNode, weight - 1, visited),
      totalWeight
    );
  });
  return totalWeight;
};

export const getBoundariesInfo = (boundaries: Boundary[]) => ({
  count: boundaries.length,
  isAppBoundary: boundaries.length > 0 && boundaries[0].type === "app",
  isNamespaceBoundary:
    boundaries.length === 0 || boundaries[0].type === "namespace"
});

const updateNodesWeights = (ctx: Context, graph: Graph): Graph => {
  const weights = {
    top: {},
    bottom: {},
    app: {},
    namespaces: {}
  };
  const nodesCnt = Object.keys(graph).length;
  return reduceGraph<Graph>(graph, (reducedGraph, node) => {
    if (node.weight !== undefined) {
      return reducedGraph;
    }
    const boundariesInfo = getBoundariesInfo(ctx.boundaries);
    let key: keyof typeof weights = boundariesInfo.isAppBoundary
      ? "app"
      : "namespaces";
    if (isTopNode(node)) {
      key = "top";
    } else if (isBottomNode(node)) {
      key = "bottom";
    }
    if (isLeftNode(node)) {
      reducedGraph[node.endpoint.id] = {
        ...node,
        weight: 100500 * 2
      };
      return reducedGraph;
    }
    const numberOfAllowedNodes = calcNumberOfAllowedNodes(graph, node);
    let weight = numberOfAllowedNodes;
    forEachNode(graph, currentNode => {
      let currentNodeAllowed = false;
      forEachAllowedNode(graph, currentNode, allowedNode => {
        if (node.endpoint.id === allowedNode.endpoint.id) {
          currentNodeAllowed = true;
        }
      });
      const isSameNode = node.endpoint.id === currentNode.endpoint.id;
      if (!isSameNode && currentNodeAllowed) {
        weight++;
      }
    });
    if (boundariesInfo.isAppBoundary) {
      weight = weight === 0 ? -100500 : traverseForWeight(graph, node, 1);
      while (weights[key][weight] >= 4) {
        weight--;
      }
      if (!weights[key][weight]) {
        weights[key][weight] = 0;
      }
      weights[key][weight]++;
    } else if (boundariesInfo.isNamespaceBoundary) {
      const nodeNamespace = findNamespaceFromLabels(node.endpoint.labels);
      const boundaryidx = ctx.boundaries.findIndex(
        boundary => boundary.title === nodeNamespace
      );
      const namespaceOffset =
        (nodesCnt + boundariesInfo.count) * boundaryidx * 10 + 30;
      weight =
        namespaceOffset +
        (weight === 0
          ? -(namespaceOffset / 2 + 15) // place on right
          : traverseForWeight(graph, node, 1));
      const subkey = boundaryidx >= 0 ? nodeNamespace : "__outside__";
      if (!weights[key][subkey]) {
        weights[key][subkey] = {};
      }
      while (weights[key][subkey][weight] >= 4) {
        weight--;
      }
      if (!weights[key][subkey][weight]) {
        weights[key][subkey][weight] = 0;
      }
      weights[key][subkey][weight]++;
    }
    reducedGraph[node.endpoint.id] = {
      ...node,
      weight
    };
    return reducedGraph;
  });
};

const calcAppBorderWithCoords = (
  ctx: Context,
  graph: Graph
): BoundaryWithCoords[] => {
  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let maxHeight = Number.MIN_VALUE;
  forEachNode(graph, node => {
    if (!isTopNode(node) && !isLeftNode(node) && !isBottomNode(node)) {
      const { x, y, height } = node;
      if (x < minX) {
        minX = x;
      }
      if (x > maxX) {
        maxX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (y + height > maxHeight) {
        maxHeight = y + height;
      }
    }
  });
  return [
    {
      ...ctx.boundaries[0],
      coords: {
        x: minX,
        y: minY,
        width: Math.max(maxX - minX + NODE_WIDTH, 0),
        height: Math.max(maxHeight - minY, 0)
      }
    }
  ];
};

const calcNamespacesBordersWithCoords = (
  ctx: Context,
  graph: Graph
): BoundaryWithCoords[] => {
  const boundaries: { [key: string]: BoundaryWithCoords } = {};
  ctx.boundaries.forEach(boundary => {
    if (!boundaries[boundary.title]) {
      boundaries[boundary.title] = {
        ...boundary,
        coords: {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        }
      };
    }
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxHeight = Number.MIN_VALUE;
    forEachNode(graph, node => {
      if (!isTopNode(node) && !isLeftNode(node) && !isBottomNode(node)) {
        const nodeNamespace = findNamespaceFromLabels(node.endpoint.labels);
        if (boundary.title === nodeNamespace) {
          const { x, y, height } = node;
          if (x < minX) {
            minX = x;
          }
          if (x > maxX) {
            maxX = x;
          }
          if (y < minY) {
            minY = y;
          }
          if (y + height > maxHeight) {
            maxHeight = y + height;
          }
        }
      }
    });
    boundaries[boundary.title].coords.x = minX;
    boundaries[boundary.title].coords.y = minY;
    boundaries[boundary.title].coords.width = Math.max(
      maxX - minX + NODE_WIDTH,
      0
    );
    boundaries[boundary.title].coords.height = Math.max(maxHeight - minY, 0);
  });
  return Object.values(boundaries);
};

const calcLevels = (graph: Graph): Levels => {
  const weights = reduceGraph<{ [key: number]: string[] }>(
    graph,
    (acc, node) => {
      if (isTopNode(node) || isBottomNode(node)) {
        return acc;
      }
      const level = acc[node.weight!] || [];
      acc[node.weight!] = level.concat(node.endpoint.id);
      return acc;
    },
    {}
  );
  return Object.keys(weights)
    .map(weight => [weight, weights[weight]])
    .sort(([a, _a], [b, _b]) => b - a)
    .reduce<Levels>((acc, [_, nodes]) => acc.concat([nodes]), []);
};

const calcNodeContentHeight = (node: Node) => {
  const labelsCount = getExtraLabels(node.endpoint.labels).length;
  const labelsHeight =
    labelsCount === 0
      ? 0
      : LABELS_V_PADDINGS +
        ((LABEL_HEIGHT + LABEL_BOTTOM_MARGIN) * labelsCount -
          LABEL_BOTTOM_MARGIN);

  let startedHeight =
    2 + NODE_HEADER_HEIGHT + INGRESS_EGRESS_HEIGHT + labelsHeight;
  if (node.isFlowsFiltered) {
    startedHeight += 23;
  }
  return node.protocolsFunctionsGroups.reduce(
    (height, { visibleFunctionsGroups, protocolIndex, filteredFunctions }) => {
      const numberOfFunctions = visibleFunctionsGroups.reduce(
        (cnt, { groupTitle, functions }) => {
          return cnt + (groupTitle.length > 0 ? 1 : 0) + functions.length;
        },
        0
      );
      let currentHeight = height + PROTOCOL_HEADER_HEIGHT;
      if (numberOfFunctions > 0) {
        currentHeight += protocolIndex === 0 ? 8 : 7;
      } else {
        currentHeight += 1;
      }
      currentHeight += numberOfFunctions * FUNCTION_HEIGHT;
      if (filteredFunctions.length > 0) {
        currentHeight += 30;
      }
      return currentHeight;
    },
    startedHeight
  );
};

const calcLevelsHeights = (graph: Graph, levels: Levels): LevelsHeights => {
  const levelsHeights: LevelsHeights = {};
  levels.forEach((ids, level) =>
    ids.forEach(id => {
      const node = graph[id];
      const levelHeight = (levelsHeights[level] || 0) + node.height + V_PADDING;
      levelsHeights[level] = levelHeight;
    })
  );
  return levelsHeights;
};

const calcGraphHeightByLevels = (levelsHeights: LevelsHeights): number => {
  let graphHeight = 0;
  Object.keys(levelsHeights).forEach(level => {
    const height = levelsHeights[level];
    if (height > graphHeight) {
      graphHeight = height;
    }
  });
  if (graphHeight > 0) {
    graphHeight += 40;
  }
  return graphHeight;
};

const calcGraphHeightByNodes = (graph: Graph): number => {
  let minY = Number.MAX_VALUE;
  let maxY = Number.MIN_VALUE;
  forEachNode(graph, node => {
    if (node.y < minY) {
      minY = node.y;
    }
    if (node.y + node.height > maxY) {
      maxY = node.y + node.height;
    }
  });
  return maxY - minY;
};

const calcGraphWidthByNodes = (graph: Graph): number => {
  let minX = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  forEachNode(graph, node => {
    if (node.x < minX) {
      minX = node.x;
    }
    if (node.x + node.width > maxX) {
      maxX = node.x + node.width;
    }
  });
  return maxX - minX;
};

const updateNodeGeometry = (
  node: Node,
  { width = node.width, height = node.height, x = node.x, y = node.y } = {}
): Node => {
  const newNode = {
    ...node,
    width,
    height,
    x,
    y
  };
  let protocolOffset = 52 + INGRESS_EGRESS_HEIGHT + 3 + 11;
  newNode.protocolsFunctionsGroups.forEach(
    ({ visibleFunctionsGroups, protocolIndex, filteredFunctions }) => {
      const protocol = node.endpoint.protocols[protocolIndex];
      protocolOffset += 16 / 2 + 2;
      newNode.protocolsCoords[protocol.id] = {
        x: x + FUNCTION_H_PADDING,
        y: y + protocolOffset
      };
      protocolOffset += 16 / 2;
      let funcOffset = protocolOffset;
      if (visibleFunctionsGroups.length >= 1) {
        funcOffset += 11;
      }
      visibleFunctionsGroups.forEach(group => {
        const newGroup = { ...group };
        if (newGroup.groupTitle.length > 0) {
          funcOffset += 19;
        }
        newNode.groupsCoords[`${protocol.id}:${group.groupTitle}`] = {
          x: x + FUNCTION_H_PADDING,
          y: y + funcOffset - 19 / 2
        };
        newGroup.functions.forEach(({ functionIndex }) => {
          // prettier-ignore
          const func = (newNode.endpoint.protocols[protocolIndex].functions || [])[functionIndex];
          funcOffset += 19;
          newNode.functionsCoords[func.id] = {
            x: x + FUNCTION_H_PADDING,
            y: y + funcOffset - 19 / 2
          };
        });
      });
      protocolOffset = funcOffset + 15;
      if (filteredFunctions.length > 0) {
        protocolOffset += 11;
        newNode.moreLabelsCoords[protocol.id] = {
          x: x + FUNCTION_H_PADDING,
          y: y + protocolOffset
        };
        protocolOffset += 15;
      }
      protocolOffset += 11;
    }
  );
  return newNode;
};

const updateNodesWidthsHeights = (graph: Graph) =>
  reduceGraph<Graph>(graph, (reducedGraph, node) => {
    reducedGraph[node.endpoint.id] = updateNodeGeometry(node, {
      width: NODE_WIDTH,
      height: calcNodeContentHeight(node)
    });
    return reducedGraph;
  });

const updateNodeConnectors = (ctx: Context, graph: Graph, node: Node): Node => {
  const leftAllowedNodes: Node[] = [];
  const rightAllowedNodes: Node[] = [];

  const filtered = hasEndpointFilter(ctx.endpointsFilter);

  forEachAllowedNode(
    graph,
    node,
    allowedNode => {
      const { endpoint } = allowedNode;
      if (graph[endpoint.id]) {
        if (graph[endpoint.id].x < node.x) {
          leftAllowedNodes.push(allowedNode);
        }
        if (graph[endpoint.id].x >= node.x) {
          rightAllowedNodes.push(allowedNode);
        }
      }
    },
    ctx
  );

  const genNodeConnectors = (
    allowedNodes: Node[],
    xOffset: number
  ): { [key: string]: { x: number; y: number } } => {
    let nodeMinFunctionY = Number.MAX_VALUE;
    let nodeMaxFunctionY = Number.MIN_VALUE;
    const connectors = allowedNodes
      .reduce<{ node: Node; x: number; y: number }[]>((points, allowedNode) => {
        let minFunctionY = Number.MAX_VALUE;
        let maxFunctionY = Number.MIN_VALUE;

        const tryUpdateMinMaxYWithValue = (value: number) => {
          if (!filtered) {
            if (node.connection.type === "many-ingress-to-app") {
              return;
            }
          }
          if (value < minFunctionY) {
            minFunctionY = value;
          }
          if (value > maxFunctionY) {
            maxFunctionY = value;
          }
        };

        node.protocolsFunctionsGroups.forEach(
          ({
            visibleFunctionsGroups,
            visibleAllowedSources,
            protocolIndex,
            filteredFunctions
          }) => {
            const protocol = node.endpoint.protocols[protocolIndex];
            const foundProtocolAllowedSource = visibleAllowedSources.some(
              allowedSource => allowedSource === allowedNode.endpoint.id
            );
            if (foundProtocolAllowedSource) {
              tryUpdateMinMaxYWithValue(node.protocolsCoords[protocol.id].y);
            }

            const foundTruncatedAllowedSource = filteredFunctions.some(func =>
              func.allowedSources.some(
                allowedSource => allowedSource === allowedNode.endpoint.id
              )
            );
            if (foundTruncatedAllowedSource) {
              tryUpdateMinMaxYWithValue(node.moreLabelsCoords[protocol.id].y);
            }
            visibleFunctionsGroups.forEach(({ functions }) => {
              functions.forEach(({ functionIndex, visibleAllowedSources }) => {
                const func = (protocol.functions || [])[functionIndex];
                const foundFunctionAllowedSource = visibleAllowedSources.some(
                  allowedSource => allowedSource === allowedNode.endpoint.id
                );
                if (foundFunctionAllowedSource) {
                  tryUpdateMinMaxYWithValue(node.functionsCoords[func.id].y);
                }
              });
            });
          }
        );

        if (minFunctionY < nodeMinFunctionY) {
          nodeMinFunctionY = minFunctionY;
        }
        if (maxFunctionY > nodeMaxFunctionY) {
          nodeMaxFunctionY = maxFunctionY;
        }

        const y = minFunctionY + (maxFunctionY - minFunctionY) / 2;
        const x = node.x + xOffset;
        points.push({ node: allowedNode, y, x });

        return points;
      }, [])
      .sort((a, b) => a.y - b.y);

    const len = connectors.length;
    for (let i = 1; i < len; i += 1) {
      const a = connectors[i - 1];
      const b = connectors[i];
      const diff = b.y - a.y;
      if (diff < FUNCTION_HEIGHT) {
        const halfDiff = (FUNCTION_HEIGHT - diff) / 2;
        for (let j = i - 1; j >= 0; j -= 1) {
          connectors[j].y -= halfDiff;
        }
        for (let j = i; j < len; j += 1) {
          connectors[j].y += halfDiff;
        }
      }
    }

    let minFunctionY = Number.MAX_VALUE;
    let maxFunctionY = Number.MIN_VALUE;
    connectors.forEach(({ y }) => {
      if (y < minFunctionY) {
        minFunctionY = y;
      }
      if (y > maxFunctionY) {
        maxFunctionY = y;
      }
    });
    const topYDiff = nodeMinFunctionY - minFunctionY;
    if (topYDiff > 0) {
      const bottomYDiff = maxFunctionY - nodeMaxFunctionY;
      const diff = Math.abs(topYDiff - bottomYDiff) / 2;
      connectors.forEach(point => {
        point.y += diff;
      });
    }

    return connectors.reduce((points, point) => {
      points[point.node.endpoint.id] = {
        x: point.x,
        y: point.y
      };
      return points;
    }, {});
  };

  const leftConnectors = genNodeConnectors(
    // leftAllowedSources,
    leftAllowedNodes.concat(rightAllowedNodes),
    -OUTER_POINT_PADDING
  );
  const rightConnectors = genNodeConnectors(
    rightAllowedNodes,
    node.width + OUTER_POINT_PADDING
  );

  return {
    ...node,
    connectors: {
      ...leftConnectors
      // ...rightConnectors
    }
  };
};

const updateNodesConnectors = (ctx: Context, graph: Graph) =>
  reduceGraph<Graph>(graph, (reducedGraph, node) => {
    reducedGraph[node.endpoint.id] = updateNodeConnectors(ctx, graph, node);
    return reducedGraph;
  });

const calcInAppNodesXOffsets = (graph: Graph, levels: Levels) => {
  levels.forEach((ids, level) =>
    ids.forEach(id => {
      const node = graph[id];
      const x = (NODE_WIDTH + H_PADDING) * level + MAP_H_PADDING;
      graph[node.endpoint.id] = updateNodeGeometry(node, { x, y: 0 });
    })
  );
  return graph;
};

const layoutCentralNodes = (
  graph: Graph,
  levels: Levels,
  aboveLayoutHeight: number
) => {
  const levelsHeights = calcLevelsHeights(graph, levels);
  const height = calcGraphHeightByLevels(levelsHeights);

  let additionalOffset = aboveLayoutHeight;
  if (additionalOffset > 0) {
    additionalOffset += V_PADDING * 3;
  }
  let layoutHeight = 0;
  const levelsOffsets = {};
  levels.forEach((ids, level) =>
    ids.forEach(id => {
      const node = graph[id];
      const levelHeight = levelsHeights[level];
      const levelOffset = (height - levelHeight) / 2;
      const vOffset = levelsOffsets[level] || 0;
      levelsOffsets[level] = vOffset + node.height + V_PADDING;
      const y = vOffset + levelOffset + additionalOffset;
      graph[node.endpoint.id] = updateNodeGeometry(node, { y });
      if (y + node.height > layoutHeight) {
        layoutHeight = y + node.height;
      }
    })
  );
  return { graph, layoutHeight };
};

const layoutOutsideNodes = (
  graph: Graph,
  appColumnsCount: number,
  nodeChecker: (node: Node) => boolean,
  addYOffset: number = 0
) => {
  let hasWorldIngress = false;
  forEachNode(graph, node => {
    if (isIngressNode(node)) {
      hasWorldIngress = true;
    }
  });

  const nodes: Node[] = [];
  forEachNode(graph, node => {
    if (nodeChecker(node)) {
      nodes.push(node);
    }
  });
  nodes.sort((a, b) => (b.weight as number) - (a.weight as number));

  let column = hasWorldIngress ? 1 : 0;
  let nodesInColumn = 0;
  let columnHeight = 0;
  let layoutHeight = 0;

  const nodesInColumnCount = Math.max(1, Math.round(Math.sqrt(nodes.length)));
  const columnsCount = Math.ceil(nodes.length / nodesInColumnCount);
  const thisLayoutWidth = columnsCount * (NODE_WIDTH + MAP_V_PADDING);
  const appLayoutWidth =
    (appColumnsCount - column) * (NODE_WIDTH + MAP_V_PADDING) - MAP_V_PADDING;
  const xPosOffset = NODE_WIDTH + H_PADDING;
  const xNegOffset = (appLayoutWidth - thisLayoutWidth) / 2;

  nodes.forEach(node => {
    const x = MAP_H_PADDING + xPosOffset * column + xNegOffset;
    const y = columnHeight + addYOffset + nodesInColumn * V_PADDING;
    if (y + node.height > layoutHeight) {
      layoutHeight = y + node.height;
    }
    graph[node.endpoint.id] = updateNodeGeometry(node, { x, y });
    columnHeight += node.height;
    nodesInColumn += 1;
    if (nodesInColumn === nodesInColumnCount) {
      column += 1;
      nodesInColumn = 0;
      columnHeight = 0;
    }
  });
  return { graph, layoutHeight };
};

const layoutBottomNodes = (
  graph: Graph,
  aboveLayoutHeight: number,
  numberOfCentralLevels: number
) => {
  let additionalOffset = aboveLayoutHeight;
  if (additionalOffset > 0) {
    additionalOffset += V_PADDING * 3;
  }
  return layoutOutsideNodes(
    graph,
    numberOfCentralLevels,
    isBottomNode,
    additionalOffset
  );
};

const layoutTopNodes = (graph: Graph, numberOfCentralLevels: number) => {
  return layoutOutsideNodes(graph, numberOfCentralLevels, isTopNode);
};

const sortInAppNodes = (ctx: Context, graph: Graph, levels: Levels) => {
  for (let level = levels.length - 1; level >= 1; level -= 1) {
    const rightLevel = levels[level];
    const leftLevel = levels[level - 1];
    for (let i = 0; i < rightLevel.length; i += 1) {
      const rightNode = updateNodeConnectors(
        ctx,
        graph,
        updateNodeGeometry(graph[rightLevel[i]], { x: 0, y: 0 })
      );
      const counters: { [key: string]: { sum: number; cnt: number } } = {};
      for (let j = 0; j < leftLevel.length; j += 1) {
        const leftNode = graph[leftLevel[j]];
        const rightConnectors = rightNode.connectors[leftNode.endpoint.id];
        if (rightConnectors) {
          const dist = distBetweenPoints(
            leftNode.x,
            leftNode.y,
            rightConnectors.x,
            rightConnectors.y
          );
          const counter = counters[leftNode.endpoint.id];
          counters[leftNode.endpoint.id] = {
            sum: counter ? counter.sum + dist : dist,
            cnt: counter ? counter.cnt + 1 : 1
          };
        }
      }
      leftLevel.sort((a, b) => {
        const counterA = counters[a];
        const counterB = counters[b];
        if (counterA && counterB) {
          const avgA = counterA.sum / counterA.cnt;
          const avgB = counterB.sum / counterB.cnt;
          return avgA - avgB;
        } else if (counterA) {
          return 1;
        } else if (counterB) {
          return -1;
        } else {
          return 0;
        }
      });
    }
  }
  return graph;
};

const updateGraphGeometry = (ctx: Context, graph: Graph) => {
  const lev = calcLevels(graph);
  const app = calcInAppNodesXOffsets(graph, lev);
  const top = layoutTopNodes(app, lev.length);
  const sor = sortInAppNodes(ctx, top.graph, lev);
  const cen = layoutCentralNodes(sor, lev, top.layoutHeight);
  const bot = layoutBottomNodes(cen.graph, cen.layoutHeight, lev.length);
  const fin = updateNodesConnectors(ctx, bot.graph);
  return {
    graph: fin,
    width: calcGraphWidthByNodes(fin),
    height: calcGraphHeightByNodes(fin)
  };
};

const functionsNamesSorter = (a: string, b: string) =>
  a.replace(/\W/gi, "").localeCompare(b.replace(/\W/gi, ""));

const groupFunctionsToMap = (
  ctx: Context,
  endpoint: AppEndpoint,
  protocol: Protocol
) => {
  const mappedFunctions = (protocol.functions || []).map(
    (func, functionIndex) => {
      if (!ctx.mapFilters.showL7Traffic) {
        return {
          func,
          filtered: true,
          functionIndex
        };
      }
      let filtered = false;
      if (
        ctx.connectionsMap.filterByEndpoint &&
        ctx.connectionsMap.connections[func.id].filtered
      ) {
        filtered = false;
      } else if (!ctx.connectionsMap.filterByEndpoint) {
        filtered = false;
      } else {
        filtered = true;
      }
      return {
        func,
        filtered,
        functionIndex
      };
    }
  );

  const filteredFunctions: AppFunction[] = [];
  let numberOfNotFilteredFunctions = 0;

  const functionsMap = mappedFunctions.reduce<{
    [key: string]: FunctionGroup[];
  }>((groups, { func, functionIndex, filtered }) => {
    const { l7Protocol } = protocol;
    const isKafka = l7Protocol && l7Protocol.toLowerCase() === "kafka";
    const isFetchOrProduce =
      func.name.match(/^fetch/) || func.name.match(/^produce/);
    const isDynamo = func.name.startsWith(`{"action":"`);

    if (!filtered) {
      if (isKafka) {
        if (isFetchOrProduce) {
          numberOfNotFilteredFunctions++;
        }
      } else {
        numberOfNotFilteredFunctions++;
      }
    }

    // manually hide some kafka flows
    if (!(isKafka && !isFetchOrProduce)) {
      let groupTitle = "";
      let functionTitle = "";

      if (isDynamo) {
        try {
          const json = JSON.parse(func.name);
          if (json.table) {
            groupTitle = json.table;
            functionTitle = json.action;
          }
        } catch (error) {}
      }

      if (!groupTitle || !functionTitle) {
        if (func.dnsResponse) {
          groupTitle = func.dnsResponse.query;
          functionTitle = func.dnsResponse.rcode;
        } else if (func.httpResponse) {
          groupTitle = func.httpResponse.url;
          const httpStatusMessage =
            HTTP_STATUS_MESSAGES[func.httpResponse.code];
          functionTitle = `${func.httpResponse.method} ${
            func.httpResponse.code
          } ${httpStatusMessage ? httpStatusMessage : ""}`;
        } else {
          const splited = func.name.split(" ");
          functionTitle = splited[0];

          groupTitle = splited.slice(1).join(" ");
          switch ((protocol.l7Protocol || "").toLowerCase()) {
            case "kafka":
              groupTitle = splited.slice(2).join(" ");
              break;
            default:
              break;
          }
        }
      }

      if (!groups[groupTitle]) {
        groups[groupTitle] = [];
      }

      if (numberOfNotFilteredFunctions > MORE_FUNCTIONS_THRESHOLD) {
        filteredFunctions.push(func);
      }

      const visibleAllowedSources = func.allowedSources.filter(allowedSource =>
        checkIsAllowedSourceVisible(ctx, endpoint.id, allowedSource)
      );

      groups[groupTitle].push({
        filtered,
        visibleAllowedSources,
        functionIndex,
        functionTitle
      });
    }

    return groups;
  }, {});

  let visibleFunctionsMap = Object.keys(functionsMap).reduce<{
    [key: string]: FunctionGroup[];
  }>((groups, groupTitle) => {
    const group = functionsMap[groupTitle];
    groups[groupTitle] = group.filter(({ filtered }) => !filtered);
    return groups;
  }, {});

  visibleFunctionsMap = Object.keys(visibleFunctionsMap).reduce<{
    [key: string]: FunctionGroup[];
  }>((groups, groupTitle, groupIndex) => {
    const group = visibleFunctionsMap[groupTitle];
    if (group.length > 0 && groupIndex < MORE_FUNCTIONS_THRESHOLD) {
      groups[groupTitle] = group;
    }
    return groups;
  }, {});

  return {
    functionsMap,
    visibleFunctionsMap,
    filteredFunctions
  };
};

const mapProtocolFunctionsToProtocolFunctionsGroups = (
  ctx: Context,
  endpoint: AppEndpoint,
  protocol: Protocol
) => {
  const {
    functionsMap,
    visibleFunctionsMap,
    filteredFunctions
  } = groupFunctionsToMap(ctx, endpoint, protocol);

  const functionsGroups: FunctionsGroups = [];
  const visibleFunctionsGroups: FunctionsGroups = [];
  Object.keys(functionsMap)
    .sort(functionsNamesSorter)
    .map(groupTitle => {
      const group = functionsMap[groupTitle];
      functionsGroups.push({
        groupTitle,
        functions: group.sort((a, b) =>
          functionsNamesSorter(a.functionTitle, b.functionTitle)
        )
      });
    });
  Object.keys(visibleFunctionsMap)
    .sort(functionsNamesSorter)
    .map(groupTitle => {
      const group = visibleFunctionsMap[groupTitle];
      visibleFunctionsGroups.push({
        groupTitle,
        functions: group.sort((a, b) =>
          functionsNamesSorter(a.functionTitle, b.functionTitle)
        )
      });
    });

  const visibleAllowedSources = protocol.allowedSources.filter(allowedSource =>
    checkIsAllowedSourceVisible(ctx, endpoint.id, allowedSource)
  );

  return {
    functionsGroups,
    visibleFunctionsGroups,
    filteredFunctions,
    visibleAllowedSources
  };
};

const checkIsAllowedSourceVisible = (
  ctx: Context,
  currentEndpointId: string,
  allowedSource: string
) => {
  if (currentEndpointId === ctx.endpointsFilter.self) {
    return true;
  }
  if (currentEndpointId === ctx.endpointsFilter.to) {
    return true;
  }
  if (allowedSource === ctx.endpointsFilter.self) {
    return true;
  }
  if (allowedSource === ctx.endpointsFilter.from) {
    return true;
  }
  return (
    !ctx.endpointsFilter.self &&
    !ctx.endpointsFilter.from &&
    !ctx.endpointsFilter.to
  );
};

export const buildConnectionsMap = (
  endpoints: AppEndpoint[],
  endpointFilter: EndpointQueryObject
): ConnectionsMap => {
  const conn = (
    id: string,
    key: "filtered" | "from" | "to" | "outside" | "type" | "init",
    value: any = true
  ) => {
    if (key === "init") {
      res.connections[id] = {
        ...res.connections[id]
      };
    } else {
      res.connections[id] = {
        ...res.connections[id],
        [key]: value
      };
    }
  };
  const inc = (from: string, to: string) => {
    if (!outside[from] && outside[to]) {
      outside[to].from[from] = true;
    } else if (outside[from] && !outside[to]) {
      outside[from].to[to] = true;
    }
  };
  const { self, from, to } = endpointFilter;
  const res: ConnectionsMap = {
    filterByEndpoint: self || from || to || null,
    connections: {}
  };
  const outside: {
    [key: string]: {
      from: { [key: string]: boolean };
      to: { [key: string]: boolean };
    };
  } = {};
  endpoints.forEach((endpoint: AppEndpoint) => {
    const isOutside = !isInAppEndpoint(endpoint);
    conn(endpoint.id, "outside", isOutside);
    if (isOutside) {
      outside[endpoint.id] = {
        from: {},
        to: {}
      };
    }
  });
  endpoints.forEach(endpoint => {
    const { id: eid } = endpoint;
    conn(eid, "init");
    if (eid === self || eid === from || eid === to) {
      conn(eid, "filtered");
    }
    endpoint.protocols.forEach(prot => {
      const { id: pid } = prot;
      conn(pid, "init");
      if (res.connections[eid].filtered) {
        conn(pid, "filtered");
      }
      prot.allowedSources.forEach(pasid => {
        conn(pasid, "init");
        inc(pasid, endpoint.id);
        const allowed = pasid === self || pasid === from;
        if (allowed || (res.connections[eid].filtered && eid !== from)) {
          conn(eid, "filtered");
          conn(pid, "filtered");
          conn(pasid, "filtered");
        }
        conn(eid, "to");
        conn(pid, "to");
        conn(pasid, "from");
      });
      (prot.functions || []).forEach(func => {
        const { id: fid } = func;
        conn(fid, "init");
        if (res.connections[eid].filtered) {
          conn(pid, "filtered");
          conn(fid, "filtered");
        }
        func.allowedSources.forEach(fasid => {
          inc(fasid, endpoint.id);
          conn(fasid, "init");
          const allowed = fasid === self || fasid === from;
          if (allowed || (res.connections[eid].filtered && eid !== from)) {
            conn(eid, "filtered");
            conn(pid, "filtered");
            conn(fid, "filtered");
            conn(fasid, "filtered");
          }
          conn(eid, "to");
          conn(pid, "to");
          conn(fid, "to");
          conn(fasid, "from");
        });
      });
    });
  });
  const inAppCount = endpoints.length - Object.keys(outside).length;
  Object.keys(outside).forEach(id => {
    const out = outside[id];
    if (Object.keys(out.from).length >= 3) {
      conn(id, "type", "many-egress-from-app");
    } else if (Object.keys(out.to).length >= 3) {
      conn(id, "type", "many-ingress-to-app");
    }
  });
  return res;
};
