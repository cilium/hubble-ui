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
import * as hash from "object-hash";
import {
  AppEndpoint,
  AppFunctionInput,
  FlowDnsResponse,
  FlowHttpResponse,
  Label,
  Protocol,
  ProtocolInput
} from "../graphqlTypes";

export function getEndpointHash(
  labels: Label[],
  v4Cidrs?: string[] | null,
  v6Cidrs?: string[] | null,
  dnsName?: string | null
): string {
  return dnsName
    ? hash(dnsName)
    : (v4Cidrs || []).length > 0 || (v6Cidrs || []).length > 0
    ? hash({ v4Cidrs, v6Cidrs }, { unorderedArrays: true })
    : hash(labels);
}

export function protocolId(
  endpoint: AppEndpoint,
  protocol: ProtocolInput
): string {
  return protocolIdRaw(endpoint.id, protocol.l34Protocol, protocol.port);
}

export function functionId(
  endpoint: AppEndpoint,
  protocol: Protocol,
  func: AppFunctionInput
): string {
  return functionIdRaw(
    endpoint.id,
    protocol.id,
    func.name,
    func.dnsResponse,
    func.httpResponse
  );
}

export function protocolIdRaw(
  endpointId: string,
  l34Protocol: string,
  port: number | null | undefined
): string {
  return hash([
    endpointId,
    l34Protocol.toUpperCase(),
    port ? parseInt(port + "", 10) : port
  ]);
}

export function functionIdRaw(
  endpointId: string,
  protocolId: string,
  functionName: string,
  dnsResponse: FlowDnsResponse | null | undefined,
  httpResponse: FlowHttpResponse | null | undefined
): string {
  const h: any[] = [endpointId, protocolId, functionName];
  if (dnsResponse) {
    h.push(dnsResponse.query, dnsResponse.rcode);
  }
  if (httpResponse) {
    h.push(
      httpResponse.url,
      httpResponse.protocol,
      httpResponse.method,
      httpResponse.code
    );
  }
  return hash(h);
}
