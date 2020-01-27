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
import { EndpointElement } from "./endpointElement";
import { AppEndpoint } from "./graphqlTypes";
import { findCidrAppEndpoint } from "./shared/finders";
import { WORLD_ENDPOINT } from "./shared/misc";
import { getIpAddress, protocolWithId } from "./utils";

export function getCidrEndpointElement(
  element: EndpointElement
): EndpointElement {
  const ip = getIpAddress(element.endpoint);
  if (ip === "") {
    return element;
  }
  if (!new Address4(ip).valid && !new Address6(ip).valid) {
    throw new Error(`Invalid IP address: ${ip}`);
  }
  const protocol = element.protocol
    ? protocolWithId(WORLD_ENDPOINT, element.protocol)
    : null;
  return new EndpointElement(WORLD_ENDPOINT, protocol, element.func);
}

export function getEndpointAndProtocolForEgress(
  element: EndpointElement,
  appEndpointMap: Map<string, AppEndpoint>
): { newElement: EndpointElement; fromApp: boolean } {
  const endpoints = [...appEndpointMap.values()];
  const endpoint = findCidrAppEndpoint(
    endpoints,
    element.endpoint.v4Cidrs,
    element.endpoint.v6Cidrs
  );
  return endpoint
    ? {
        newElement: new EndpointElement(
          endpoint,
          element.protocol,
          element.func
        ),
        fromApp: true
      }
    : {
        newElement: getCidrEndpointElement(element),
        fromApp: false
      };
}
