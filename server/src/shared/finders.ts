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
import { AppEndpoint, Label } from "../graphqlTypes";
import { NAMESPACE_LABEL } from "./constants";

export function findNameLabelValue(
  labelKeys: string[],
  labels: Label[]
): string {
  for (let labelKey of labelKeys) {
    const label = labels.find(label => label.key === labelKey);
    if (label) {
      return label.value;
    }
  }
  return findReservedEntityString(labels).replace(/^\w/, c => c.toUpperCase());
}

export function findSomeReservedLabelKey(labels: Label[]): string {
  const reservedLabel = labels.find(({ key }) => key.startsWith("reserved:"));
  return reservedLabel ? reservedLabel.key : "";
}

export function findNamespaceFromLabels(labels: Label[]): string {
  const namespaceLabel = labels.find(label => label.key === NAMESPACE_LABEL);
  return namespaceLabel ? namespaceLabel.value : "";
}

export function findReservedEntityString(labels: Label[]): string {
  const reservedLabel = findSomeReservedLabelKey(labels);
  return reservedLabel ? reservedLabel.substr(9) : "";
}

export const findCidrAppEndpoint = (
  endpoints: AppEndpoint[],
  v4CidrsForCompare: string[] | null | undefined,
  v6CidrsForCompare: string[] | null | undefined
) => {
  type Accum = [number, AppEndpoint | null];
  const [_, endpoint] = endpoints.reduce<Accum>(
    (accum, endpoint) => {
      const [bestSubnetMask, _] = accum;
      const endpointSubnetMask = findCidrEndpointSubnetMask(
        bestSubnetMask,
        v4CidrsForCompare,
        v6CidrsForCompare,
        endpoint
      );
      if (endpointSubnetMask > bestSubnetMask) {
        return [endpointSubnetMask, endpoint];
      }
      return accum;
    },
    [-1, null]
  );
  return endpoint;
};

export const findDnsAppEndpoint = (
  endpoints: AppEndpoint[],
  dnsName?: string | null
) => {
  if (!dnsName) {
    return null;
  }
  const dnsEndpoint = endpoints.find(endpoint => endpoint.dnsName === dnsName);
  return dnsEndpoint ? dnsEndpoint : null;
};

export const findCidrEndpointSubnetMask = (
  bestSubnetMask: number,
  v4CidrsForCompare: string[] | null | undefined,
  v6CidrsForCompare: string[] | null | undefined,
  endpointToCompareWith: AppEndpoint
) => {
  if (v4CidrsForCompare && v4CidrsForCompare.length === 1) {
    const v4Address = new Address4(v4CidrsForCompare[0]);
    const endpointV4Cidrs = endpointToCompareWith.v4Cidrs;
    for (let i = 0; endpointV4Cidrs && i < endpointV4Cidrs.length; i++) {
      const v4Cidr = new Address4(endpointV4Cidrs[i]);
      if (
        v4Address.valid &&
        v4Cidr.valid &&
        v4Address.isInSubnet(v4Cidr) &&
        v4Cidr.subnetMask > bestSubnetMask
      ) {
        return v4Cidr.subnetMask;
      }
    }
  } else if (v6CidrsForCompare && v6CidrsForCompare.length === 1) {
    const v6Address = new Address6(v6CidrsForCompare[0]);
    const endpointV6Cidrs = endpointToCompareWith.v6Cidrs;
    for (let i = 0; endpointV6Cidrs && i < endpointV6Cidrs.length; i++) {
      const v6Cidr = new Address6(endpointV6Cidrs[i]);
      if (
        v6Address.valid &&
        v6Cidr.valid &&
        v6Address.isInSubnet(v6Cidr) &&
        v6Cidr.subnetMask > bestSubnetMask
      ) {
        return v6Cidr.subnetMask;
      }
    }
  }
  return bestSubnetMask;
};
