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
import { Address4, Address6 } from "ip-address";
import { AppEndpoint, AppEndpointType, Flow, Label } from "../graphqlTypes";
import {
  isLabelListInNamespaces,
  isReservedClusterLabels,
  isReservedLabels,
  isReservedWorldLabels
} from "./checkers";
import { findCidrAppEndpoint, findNameLabelValue } from "./finders";
import { functionIdRaw, getEndpointHash, protocolIdRaw } from "./generators";
import { WORLD_ENDPOINT } from "./misc";
import { portToAppProtocolTuple } from "./portMapping";

export const CLUSTER_LABEL = "covalent.io/cluster";
export const CIDR_LABEL = "cidr";

export function removeUnnecessaryLabel(
  labels: Label[],
  excludedLabelKeys: string[]
): Label[] {
  return labels.filter(
    label =>
      label.key !== CLUSTER_LABEL &&
      label.key !== CIDR_LABEL &&
      !excludedLabelKeys.find(key => key === label.key)
  );
}

export const isWildcardDNS = (dnsName: string): boolean => {
  return dnsName.split(".").indexOf("*") >= 0;
};

export const matchWildcardDNS = (
  wildcardDNSName: string,
  dnsName: string
): boolean => {
  const wildcardDNSNameComponents = wildcardDNSName.split(".");
  const dnsNameComponents = dnsName.split(".");
  if (wildcardDNSNameComponents.length !== dnsNameComponents.length) {
    return false;
  }
  for (let i = 0; i < wildcardDNSNameComponents.length; i++) {
    if (
      wildcardDNSNameComponents[i] !== "*" &&
      wildcardDNSNameComponents[i] !== dnsNameComponents[i]
    ) {
      return false;
    }
  }
  return true;
};

export const buildSourceEndpointFromFlow = (
  flow: Flow,
  namespaces: string[],
  nameLabelKeys: string[],
  excludedLabelKeys: string[]
): AppEndpoint => {
  return {
    id: getEndpointHash(flow.sourceLabels, [], []),
    name: findNameLabelValue(nameLabelKeys, flow.sourceLabels),
    labels: removeUnnecessaryLabel(flow.sourceLabels, excludedLabelKeys),
    disabled: false,
    protocols: [],
    v4Cidrs: [],
    v6Cidrs: [],
    type: getSourceEndpointType(flow.sourceLabels, namespaces)
  };
};

export const buildDnsAppEndpoint = (
  dnsName: string,
  endpoints: AppEndpoint[]
): AppEndpoint => {
  const dnsWildcardEndpoints = endpoints.filter(endpoint => {
    return endpoint.dnsName && isWildcardDNS(endpoint.dnsName);
  });
  for (let i = 0; i < dnsWildcardEndpoints.length; i++) {
    if (matchWildcardDNS(dnsWildcardEndpoints[i].dnsName!, dnsName)) {
      return dnsWildcardEndpoints[i];
    }
  }

  return {
    id: getEndpointHash([], [], [], dnsName),
    name: dnsName,
    dnsName: dnsName,
    labels: [],
    disabled: false,
    protocols: [],
    type: AppEndpointType.DNS
  };
};

export const buildDestinationEndpointFromFlow = (
  endpoints: AppEndpoint[],
  flow: Flow,
  namespaces: string[],
  nameLabelKeys: string[],
  sourceEndpointId: string,
  excludedLabelKeys: string[]
): AppEndpoint => {
  const isL7Flow = Boolean((flow as Flow).destinationL7Protocol);
  const { v4Cidrs = [], v6Cidrs = [] } = ipAddressv4v6Cidrs(
    flow.destinationIpAddress
  );
  let destinationAppEndpoint: AppEndpoint;
  const labels = removeUnnecessaryLabel(
    flow.destinationLabels,
    excludedLabelKeys
  );
  if (isReservedWorldLabels(flow.destinationLabels)) {
    if (flow.destinationDnsName) {
      destinationAppEndpoint = buildDnsAppEndpoint(
        flow.destinationDnsName,
        endpoints
      );
    } else {
      const endpointForCidrs = findCidrAppEndpoint(endpoints, v4Cidrs, v6Cidrs);
      destinationAppEndpoint = {
        ...(endpointForCidrs ? endpointForCidrs : WORLD_ENDPOINT),
        labels,
        v4Cidrs,
        v6Cidrs
      };
    }
  } else if (
    isReservedClusterLabels(flow.destinationLabels) &&
    flow.destinationDnsName
  ) {
    destinationAppEndpoint = buildDnsAppEndpoint(
      flow.destinationDnsName,
      endpoints
    );
  } else {
    destinationAppEndpoint = {
      id: getEndpointHash(flow.destinationLabels, [], []),
      name: findNameLabelValue(nameLabelKeys, flow.destinationLabels),
      labels,
      disabled: false,
      protocols: [],
      type: getDestinationEndpointType(flow.destinationLabels, namespaces)
    };
  }
  destinationAppEndpoint.protocols = [
    {
      id: protocolIdRaw(
        destinationAppEndpoint.id,
        flow.destinationL4Protocol,
        flow.destinationPort
      ),
      ...(isL7Flow
        ? {
            l7Protocol: (flow as Flow).destinationL7Protocol,
            applicationProtocol: portToAppProtocolTuple(
              flow.destinationPort,
              (flow as Flow).destinationL7Protocol
            )[1]
          }
        : {
            l7Protocol: null,
            applicationProtocol: null
          }),
      l34Protocol: flow.destinationL4Protocol,
      port: flow.destinationPort,
      allowedSources: isL7Flow ? [] : [sourceEndpointId],
      allowedSourcesDisabled: [],
      functions: [],
      httpRewriteRules: []
    }
  ];

  if (isL7Flow) {
    const protocol = destinationAppEndpoint.protocols[0]!;
    const funcName = flow.destinationFunctionName || "";
    protocol.functions = [
      {
        id: functionIdRaw(
          destinationAppEndpoint.id,
          destinationAppEndpoint.protocols![0].id,
          funcName,
          flow.dnsResponse,
          flow.httpResponse
        ),
        name: funcName,
        allowedSources: [sourceEndpointId],
        allowedSourcesDisabled: [],
        disabled: false,
        dnsResponse: flow.dnsResponse,
        httpResponse: flow.httpResponse
      }
    ];
  }
  return destinationAppEndpoint;
};

export const ipAddressv4v6Cidrs = (
  cidr: string | null | undefined
): {
  readonly v4Cidrs?: string[];
  readonly v6Cidrs?: string[];
} => {
  return {
    ...(cidr && new Address4(cidr).valid ? { v4Cidrs: [cidr] } : {}),
    ...(cidr && new Address6(cidr).valid ? { v6Cidrs: [cidr] } : {})
  };
};

export const getSourceEndpointType = (
  labels: Label[],
  appNamespaces: string[]
): AppEndpointType | null => {
  if (isReservedWorldLabels(labels)) {
    return AppEndpointType.SOURCE_RESERVED_WORLD;
  } else if (
    isReservedLabels(labels) ||
    isLabelListInNamespaces(labels, appNamespaces)
  ) {
    return null;
  } else {
    return AppEndpointType.OUTSIDE_MANAGED;
  }
};

export const getDestinationEndpointType = (
  labels: Label[],
  appNamespaces: string[]
): AppEndpointType | null => {
  if (isReservedWorldLabels(labels)) {
    return AppEndpointType.CIDR_ALLOW_ALL;
  } else if (
    isReservedLabels(labels) ||
    isLabelListInNamespaces(labels, appNamespaces)
  ) {
    return null;
  } else {
    return AppEndpointType.OUTSIDE_MANAGED;
  }
};
