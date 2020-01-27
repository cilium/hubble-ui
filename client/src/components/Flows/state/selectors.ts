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
import { isArray, mergeWith } from "lodash";
import { NAMESPACE_LABEL } from "src/shared/constants";
import { RootState } from "src/state/rootReducer";
import {
  AppEndpoint,
  AppFunction,
  FlowFiltersInput,
  ForwardingStatus,
  Label,
  Protocol,
  RejectedReason
} from "../../../graphqlTypes";
import {
  buildDestinationEndpointFromFlow,
  buildSourceEndpointFromFlow,
  ipAddressv4v6Cidrs
} from "../../../shared/builders";
import {
  isReservedClusterLabels,
  isReservedWorldLabels
} from "../../../shared/checkers";
import {
  findCidrAppEndpoint,
  findDnsAppEndpoint
} from "../../../shared/finders";
import {
  functionIdRaw,
  getEndpointHash,
  protocolIdRaw
} from "../../../shared/generators";
import { createCachedSelector, createSelector } from "../../../state";
import {
  getEndpoints,
  getEndpointsMapWithLabelsHashAsKey
} from "../../App/state/selectors";
import { addFlowsFilterLabelKeyPrefixes } from "../../App/utils";
import {
  getClusterIdFromParams,
  getFlowsFilterInputRouteState,
  getFlowsFilterTypeFromQueryParams,
  getFlowsForwardingStatusRouteState,
  getFlowsHttpStatusCodeQueryParams,
  getFlowsRejectedReasonsFromQueryParams,
  getFlowsTableGroupByOptionsFromQueryParams,
  getNamespaceFromParams
} from "../../Routing/state/selectors";
import { COLUMN_SYMBOL, COLUMN_TITLE } from "../columns/types";
import { DiscoveryFlow, ExtFlow } from "./types";
import { getFlowServiceSubtitle, getFlowServicetTitle } from "./utils";

export const getFlowsAutoRefresh = (state: RootState) => state.flows.autoRefesh;

export const getFlowsSmartAutoRefresh = createSelector(
  getFlowsAutoRefresh,
  autoRefresh => {
    return true;
  }
);

export const getFlowsLoading = (state: RootState) => state.flows.loading;

export const getFlowsConnection = (state: RootState) => {
  return state.flows.connection;
};

export const getFlowsCountLoading = (state: RootState) => {
  return state.flows.loadingChart;
};

export const getFlowsForwardingStatusWithReasonRouteState = createSelector(
  getFlowsForwardingStatusRouteState,
  (
    forwardingStatus
  ): [ForwardingStatus | undefined, RejectedReason[] | undefined] => {
    const parts = forwardingStatus ? forwardingStatus.split(",") : [];
    return [
      parts[0] as ForwardingStatus | undefined,
      (parts[1] ? [parts[1]] : undefined) as RejectedReason[] | undefined
    ];
  }
);

export const getFlowsFilterBy = createSelector(
  getNamespaceFromParams,
  getFlowsForwardingStatusWithReasonRouteState,
  getFlowsFilterInputRouteState,
  getFlowsFilterTypeFromQueryParams,
  getFlowsRejectedReasonsFromQueryParams,
  getFlowsHttpStatusCodeQueryParams,
  (
    namespaceFromParams,
    forwardingStatusWithReason,
    filterInput,
    filterType,
    rejectedReasons,
    httpStatusCode
  ): FlowFiltersInput => {
    const {
      labels: parsedLabels,
      ...parsedFilterBy
    } = parseFilterInputToFilterBy(filterInput, filterType);
    const discoveryLabels = namespaceFromParams
      ? [{ key: NAMESPACE_LABEL, value: namespaceFromParams }]
      : undefined;
    const labels = [
      ...(parsedLabels ? parsedLabels : []),
      ...(discoveryLabels ? discoveryLabels : [])
    ];
    return {
      forwardingStatus: forwardingStatusWithReason[0]
        ? forwardingStatusWithReason[0]
        : undefined,
      rejectedReason: rejectedReasons
        ? (rejectedReasons.split(",") as RejectedReason[])
        : undefined,
      // rejectedReason: forwardingStatusWithReason[1]
      //   ? forwardingStatusWithReason[1]
      //   : undefined,
      labels: labels.length > 0 ? labels : undefined,
      httpStatusCode: httpStatusCode,
      ...parsedFilterBy
    };
  }
);

export const getFlowsTableColumnsVisibility = (state: RootState) => {
  return state.flows.columnsVisibility;
};

export const getFlowsTableMode = (state: RootState) => {
  return state.flows.flowsTableMode;
};

export const getFlowsToPolicy = (state: RootState) => {
  return state.flows.flowsToPolicy;
};

export const getIsFlowToPolicyChecked = (state: RootState, flowId: string) => {
  return Boolean(getFlowsToPolicy(state)[flowId]);
};

export const getFlowsTableColumnsVisibilityWithGrouping = createSelector(
  getFlowsTableColumnsVisibility,
  getFlowsTableGroupByOptionsFromQueryParams,
  (columnsVisibility, filterGroupBy) => {
    const isGroupByDestinationNamespace =
      filterGroupBy.indexOf("groupDestinationByNamespace") !== -1;
    const isGroupByDestinationDnsName =
      filterGroupBy.indexOf("groupDestinationByDnsName") !== -1;
    let columnsVisibilityWithGouping = {
      ...columnsVisibility
    };
    if (isGroupByDestinationNamespace || isGroupByDestinationDnsName) {
      delete columnsVisibilityWithGouping[COLUMN_SYMBOL.DST_PROTOCOL];
      delete columnsVisibilityWithGouping[COLUMN_SYMBOL.DST_FUNCTION];
    }
    return columnsVisibilityWithGouping;
  }
);

export const getFlowsTableColumnsList = createSelector(
  getFlowsTableGroupByOptionsFromQueryParams,
  groupBy => {
    return [
      COLUMN_SYMBOL.SRC_POD_NAME,
      COLUMN_SYMBOL.SRC_ENDPOINT,
      COLUMN_SYMBOL.DST_POD_NAME,
      COLUMN_SYMBOL.DST_ENDPOINT,
      COLUMN_SYMBOL.DST_IP,
      COLUMN_SYMBOL.DST_PROTOCOL,
      COLUMN_SYMBOL.DST_FUNCTION,
      COLUMN_SYMBOL.FORWARDING_STATUS,
      COLUMN_SYMBOL.LAST_SEEN
    ];
  }
);

export const getFlowsTableVisibleColumns = createSelector(
  getFlowsTableColumnsList,
  getFlowsTableColumnsVisibilityWithGrouping,
  (columns, columnsVisibility) => {
    return columns.filter(column => columnsVisibility[column]);
  }
);

export const getFlowsTableMappedColumns = createSelector(
  getFlowsTableColumnsList,
  getFlowsTableColumnsVisibilityWithGrouping,
  (columns, columnsVisibility) => {
    return columns.map(column => ({
      column,
      label: COLUMN_TITLE[column],
      visible: columnsVisibility[column]
    }));
  }
);

export const getFilterByParam = (state: RootState) => {
  return "clusterId";
};

export const getFilterById = createSelector(
  getClusterIdFromParams,
  clusterId => {
    return clusterId;
  }
);

export const hasNextPage = createSelector(getFlowsConnection, connection => {
  return connection ? connection.pageInfo.hasNextPage : false;
});

export const hasPreviousPage = createSelector(
  getFlowsConnection,
  connection => {
    return connection ? connection.pageInfo.hasPreviousPage : false;
  }
);

export const getEndCursor = createSelector(getFlowsConnection, connection => {
  return connection ? connection.pageInfo.endCursor : null;
});

export const getStartCursor = createSelector(getFlowsConnection, connection => {
  return connection ? connection.pageInfo.startCursor : null;
});

export const getFlows = createSelector(
  getFlowsConnection,
  getFlowsTableGroupByOptionsFromQueryParams,
  hasNextPage,
  hasPreviousPage,
  (connection, flowGroupBy): Array<ExtFlow | null> => {
    if (connection) {
      const edges: Array<ExtFlow | null> = connection.edges.map<ExtFlow>(
        edge => {
          const { node } = edge;

          const destinationTitle = getFlowServicetTitle(
            node.destinationLabels,
            node.destinationIpAddress,
            node.destinationDnsName,
            false
          );
          const isGroupSourceByNamespace =
            flowGroupBy.indexOf("groupSourceByNamespace") != -1;
          const isGroupDestinationByNamespace =
            flowGroupBy.indexOf("groupDestinationByNamespace") != -1;
          const destinationSubtitle = getFlowServiceSubtitle(
            node.destinationLabels,
            isGroupDestinationByNamespace
          );
          const flow: ExtFlow = {
            ref: node,
            sourceElement: {
              endpoint: {
                title: getFlowServicetTitle(
                  node.sourceLabels,
                  null,
                  null,
                  isGroupSourceByNamespace
                ),
                subtitle: getFlowServiceSubtitle(
                  node.sourceLabels,
                  isGroupSourceByNamespace
                ),
                labels: node.sourceLabels
              }
            },
            destinationElement: {
              endpoint: {
                title: getFlowServicetTitle(
                  node.destinationLabels,
                  isGroupDestinationByNamespace
                    ? null
                    : node.destinationIpAddress,
                  isGroupDestinationByNamespace
                    ? null
                    : node.destinationDnsName,
                  isGroupDestinationByNamespace
                ),
                subtitle:
                  destinationTitle === destinationSubtitle
                    ? null
                    : destinationSubtitle,
                labels: node.destinationLabels,
                dnsName: node.destinationDnsName,
                ipAddress: node.destinationIpAddress
              }
            }
          };
          if (
            node.destinationPort ||
            node.destinationL4Protocol ||
            node.destinationL7Protocol
          ) {
            flow.destinationElement.protocol = {
              id: "",
              port: node.destinationPort,
              l34Protocol: node.destinationL4Protocol,
              l7Protocol: node.destinationL7Protocol
            };
          }
          if (
            node.destinationFunctionName ||
            node.dnsResponse ||
            node.httpResponse
          ) {
            flow.destinationElement.function = {
              id: "",
              name: node.destinationFunctionName,
              dnsResponse: node.dnsResponse,
              httpResponse: node.httpResponse,
              metricsResponse: node.metricsResponse
            };
          }
          return flow;
        }
      );
      return edges;
    } else {
      return [];
    }
  }
);

export const getFlowsForDiscovery = createSelector(
  getFlows,
  getEndpoints,
  getEndpointsMapWithLabelsHashAsKey,
  (flows, endpointsList, endpointsHashMap): Array<DiscoveryFlow | null> => {
    return flows.map<DiscoveryFlow | null>(flow => {
      if (!flow) {
        return flow;
      }

      const sourceEndpoint = matchEndpoint(
        endpointsList,
        endpointsHashMap,
        flow.ref.sourceLabels,
        flow.ref.sourceIpAddress,
        undefined,
        () => {
          return buildSourceEndpointFromFlow(
            flow.ref,
            [], // deploymentNamespaces,
            [], // appNameLabelKeys,
            [] // excludedLabels
          );
        }
      );

      const destinationEndpoint = matchEndpoint(
        endpointsList,
        endpointsHashMap,
        flow.ref.destinationLabels,
        flow.ref.destinationIpAddress,
        flow.ref.destinationDnsName,
        () => {
          const endpoint = buildDestinationEndpointFromFlow(
            [], // explicit empty endpoints list
            flow.ref,
            [], // deploymentNamespaces,
            [], // appNameLabelKeys,
            sourceEndpoint.id,
            [] // excludedLabels
          );
          endpoint.protocols = [];
          return endpoint;
        }
      );

      return {
        ...flow,
        sourceEndpoint,
        ...buildDestinationElements(flow, sourceEndpoint, destinationEndpoint)
      };
    });
  }
);

export const getFlowsMap = createSelector(getFlows, flows => {
  const map: { [key: string]: ExtFlow } = {};
  flows.forEach(flow => {
    if (flow) {
      map[flow.ref.id] = flow;
    }
  });
  return map;
});

export const getFlowById = createCachedSelector(
  getFlowsMap,
  (state: RootState, flowId: string) => flowId,
  (flowsMap, flowId) => {
    const flow = flowsMap[flowId];
    return flow ? flow : null;
  }
)((state, flowId) => flowId);

export const parseFilterInputToFilterBy = (
  filterInput: string | null,
  filterType: ReturnType<typeof getFlowsFilterTypeFromQueryParams>
): FlowFiltersInput => {
  if (!filterInput) {
    if (filterType === "external") {
      return {
        destinationLabels: [{ key: "reserved:world", value: "" }]
      };
    } else if (filterType === "cross-namespace") {
      return {
        crossNamespaceOnly: true
      };
    }
    return {};
  }

  const parse = (match: string, isFrom: boolean, isTo: boolean) => {
    const filterBy: FlowFiltersInput = {};
    let startFrom = 0;
    if (isFrom) {
      startFrom = "from:".length;
    } else if (isTo) {
      startFrom = "to:".length;
    }
    const pairs = match
      .substring(startFrom)
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => {
        const [key, ...rest] = s.split("=");
        return {
          key: key ? key.trim() : "",
          value: rest ? rest.join("=").trim() : ""
        };
      })
      .filter(({ key }) => Boolean(key));

    const IP_MARKER = "ip";
    const DNS_MARKER = "dns";
    const SECURITY_ID_MARKER = "security-id";
    const PORT_MARKER = "port";

    const labels = pairs.filter(
      ({ key }) =>
        key !== IP_MARKER &&
        key !== DNS_MARKER &&
        key !== SECURITY_ID_MARKER &&
        key !== PORT_MARKER
    );

    if (labels.length > 0) {
      if (isFrom) {
        filterBy.sourceLabels = labels.map(({ key, value }) => ({
          key: addFlowsFilterLabelKeyPrefixes(key),
          value
        }));
      } else if (isTo) {
        filterBy.destinationLabels = labels.map(({ key, value }) => ({
          key: addFlowsFilterLabelKeyPrefixes(key),
          value
        }));
      } else {
        filterBy.labels = labels.map(({ key, value }) => ({
          key: addFlowsFilterLabelKeyPrefixes(key),
          value
        }));
      }
    }

    const ipPair = pairs.find(({ key }) => key === IP_MARKER);
    if (ipPair && Boolean(ipPair.value)) {
      if (isFrom) {
        filterBy.sourceIpAddress = ipPair.value;
      } else {
        filterBy.destinationIpAddress = ipPair.value;
      }
    }

    const dnsPair = pairs.find(({ key }) => key === DNS_MARKER);
    if (dnsPair && Boolean(dnsPair.value)) {
      if (isTo || !isFrom) {
        filterBy.destinationDnsName = dnsPair.value;
      }
    }

    const securityIdPair = pairs.find(({ key }) => key === SECURITY_ID_MARKER);
    if (securityIdPair && Boolean(securityIdPair.value)) {
      if (isFrom) {
        filterBy.sourceSecurityId = +securityIdPair.value;
      } else if (isTo) {
        filterBy.destinationSecurityId = +securityIdPair.value;
      }
    }

    const portPair = pairs.find(({ key }) => key === PORT_MARKER);
    if (portPair && Boolean(portPair.value)) {
      if (isTo) {
        filterBy.destinationPort = +portPair.value;
      }
    }

    if (match.length > 0 && Object.keys(filterBy).length === 0) {
      filterBy.labels = [];
    }

    return filterBy;
  };

  const filterBy = filterInput
    .trim()
    .split(",")
    .reduce<FlowFiltersInput>((acc, part) => {
      return mergeWith(
        acc,
        parse(part, part.startsWith("from:"), part.startsWith("to:")),
        (objValue, srcValue) => {
          if (isArray(objValue)) {
            return objValue.concat(srcValue);
          }
          return;
        }
      );
    }, {});

  if (filterType === "external") {
    if (!filterBy.destinationLabels) {
      filterBy.destinationLabels = [{ key: "reserved:world", value: "" }];
    } else {
      filterBy.destinationLabels = filterBy.destinationLabels
        .filter(({ key }) => key !== "reserved:world")
        .concat([{ key: "reserved:world", value: "" }]);
    }
  } else if (filterType === "cross-namespace") {
    return {
      crossNamespaceOnly: true
    };
  }

  return filterBy;
};

const matchEndpoint = (
  endpointsList: AppEndpoint[],
  endpointsHashMap: { [key: string]: AppEndpoint },
  labels: Label[],
  ip: string | null | undefined,
  dnsName: string | null | undefined,
  endpointCreator: () => AppEndpoint
): AppEndpoint => {
  const endpointByHash = endpointsHashMap[getEndpointHash(labels)];
  if (isReservedWorldLabels(labels) || isReservedClusterLabels(labels)) {
    if (dnsName) {
      const dnsEndpoint = findDnsAppEndpoint(endpointsList, dnsName);
      if (dnsEndpoint) {
        return dnsEndpoint;
      } else {
        return endpointByHash || endpointCreator();
      }
    }
    const { v4Cidrs, v6Cidrs } = ipAddressv4v6Cidrs(ip);
    if ((v4Cidrs && v4Cidrs.length > 0) || (v6Cidrs && v6Cidrs.length > 0)) {
      const cidrEndpoint = findCidrAppEndpoint(endpointsList, v4Cidrs, v6Cidrs);
      if (cidrEndpoint) {
        return cidrEndpoint;
      }
    }
  }
  return endpointByHash || endpointCreator();
};

const createDestinationFunction = (
  flow: ExtFlow,
  endpointId: string,
  protocolId: string
): AppFunction | null => {
  if (!flow.ref.destinationFunctionName) {
    return null;
  }
  const functionId = functionIdRaw(
    endpointId,
    protocolId,
    flow.ref.destinationFunctionName,
    flow.ref.dnsResponse,
    flow.ref.httpResponse
  );
  return {
    id: functionId,
    allowedSources: [],
    allowedSourcesDisabled: [],
    disabled: false,
    name: flow.ref.destinationFunctionName,
    dnsResponse: flow.ref.dnsResponse,
    httpResponse: flow.ref.httpResponse
  };
};

const createDestinationProtocol = (flow: ExtFlow, endpointId: string) => {
  const protocolId = protocolIdRaw(
    endpointId,
    flow.ref.destinationL4Protocol,
    flow.ref.destinationPort
  );
  const protocol = {
    id: protocolId,
    allowedSources: [],
    allowedSourcesDisabled: [],
    l34Protocol: flow.ref.destinationL4Protocol,
    port: flow.ref.destinationPort,
    l7Protocol: flow.ref.destinationL7Protocol
  };
  return protocol;
};

const buildDestinationElements = (
  flow: ExtFlow,
  srcEndpoint: AppEndpoint,
  dstEndpoint: AppEndpoint
) => {
  let dstProtocol: Protocol | null = null;
  let dstFunction: AppFunction | null = null;
  let included = false;
  outer: for (let i = 0; i < dstEndpoint.protocols.length; i += 1) {
    const protocol = dstEndpoint.protocols[i];
    const isDestinationProtocol =
      protocol.l34Protocol === flow.ref.destinationL4Protocol &&
      protocol.port === flow.ref.destinationPort;
    if (isDestinationProtocol) {
      dstProtocol = protocol;
      if (!flow.ref.destinationFunctionName) {
        protocol.allowedSources.forEach(id => {
          if (id === srcEndpoint.id) {
            included = true;
          }
        });
        break outer;
      } else {
        const functions = protocol.functions || [];
        for (let j = 0; j < functions.length; j += 1) {
          const func = functions[j];
          if (flow.ref.destinationFunctionName === func.name) {
            dstProtocol = protocol;
            dstFunction = func;
            func.allowedSources.forEach(id => {
              if (id === srcEndpoint.id) {
                included = true;
              }
            });
            break outer;
          }
        }
      }
    }
  }
  if (!dstProtocol) {
    dstProtocol = createDestinationProtocol(flow, dstEndpoint.id);
  }
  if (!dstFunction) {
    dstFunction = createDestinationFunction(
      flow,
      dstEndpoint.id,
      dstProtocol.id
    );
  }
  return {
    included,
    destinationEndpoint: dstEndpoint,
    destinationProtocol: dstProtocol,
    destinationFunction: dstFunction
  };
};
