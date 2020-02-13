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
import * as bunyan from "bunyan";
import { AppUtils, handleEgressFlows } from "./app";
import { IClusterInfo } from "./configDb";
import { EndpointElement } from "./endpointElement";
import {
  AppEndpoint,
  AppEndpointType,
  AppFunction,
  Flow,
  Protocol
} from "./graphqlTypes";
import {
  buildDestinationEndpointFromFlow,
  buildSourceEndpointFromFlow
} from "./shared/builders";
import {
  isReservedClusterLabels,
  isReservedInitLabels,
  isReservedUnknownLabels,
  isReservedUnmanagedLabels,
  isReservedWorldLabels
} from "./shared/checkers";
import { findNamespaceFromLabels } from "./shared/finders";
import {
  functionIdRaw,
  getEndpointHash,
  protocolIdRaw
} from "./shared/generators";
import { IContext } from "./types";
import { getIpAddress, inDynamicPortRange, isCidrEndpoint } from "./utils";

export class DiscoveryUtils {
  private appUtils;
  constructor(private readonly logger: bunyan) {
    this.appUtils = new AppUtils(logger);
  }

  private static protocolHash = protocolIdRaw;

  private static functionHash = functionIdRaw;

  public static hashIdMap(endpoints: AppEndpoint[]) {
    return endpoints.reduce((accum, endpoint) => {
      const endpointHash = getEndpointHash(
        endpoint.labels,
        endpoint.v4Cidrs,
        endpoint.v6Cidrs,
        endpoint.dnsName
      );
      accum.set(endpointHash, endpoint.id);
      endpoint.protocols.forEach(protocol => {
        const protocolHash = DiscoveryUtils.protocolHash(
          endpointHash,
          protocol.l34Protocol,
          protocol.port
        );
        accum.set(protocolHash, protocol.id);
      });
      return accum;
    }, new Map<string, string>());
  }

  private static endpointsToMaps(
    endpoints: AppEndpoint[],
    endpointMap: Map<string, AppEndpoint>,
    protocolMap: Map<string, Map<string, Protocol>>,
    functionMap?: Map<string, Map<string, AppFunction>>
  ) {
    endpoints.forEach(endpoint => {
      const endpointHash = getEndpointHash(
        endpoint.labels,
        endpoint.v4Cidrs,
        endpoint.v6Cidrs,
        endpoint.dnsName
      );
      endpointMap.set(endpointHash, endpoint);
      if (!protocolMap.has(endpointHash)) {
        protocolMap.set(endpointHash, new Map<string, Protocol>());
      }
      endpoint.protocols.forEach(protocol => {
        const protoMap = protocolMap.get(endpointHash)!;
        const protocolHash = DiscoveryUtils.protocolHash(
          endpointHash,
          protocol.l34Protocol,
          protocol.port
        );
        protoMap.set(protocolHash, protocol);
        if (!protocol.l7Protocol) {
          return;
        }
        if (functionMap) {
          if (!functionMap.has(protocolHash)) {
            functionMap.set(protocolHash, new Map<string, AppFunction>());
          }
          (protocol.functions || []).forEach(func => {
            const funcHash = DiscoveryUtils.functionHash(
              endpointHash,
              protocolHash,
              func.name,
              undefined,
              undefined
            );
            const funcMap = functionMap.get(protocolHash)!;
            funcMap.set(funcHash, func);
          });
        }
      });
    });
  }

  private static getEndpointsFromFlow(
    endpoints: AppEndpoint[],
    excludedLabelKeys: string[],
    nameLabelKeys: string[],
    flow: Flow,
    namespaces: string[]
  ): { source: AppEndpoint; destination: AppEndpoint } {
    const source = buildSourceEndpointFromFlow(
      flow,
      namespaces,
      nameLabelKeys,
      excludedLabelKeys
    );
    const destination = buildDestinationEndpointFromFlow(
      endpoints,
      flow,
      namespaces,
      nameLabelKeys,
      source.id,
      excludedLabelKeys
    );
    return {
      source,
      destination
    };
  }

  public async updateEndpointsFromClusterInfo(
    endpoints: AppEndpoint[],
    excludedLabelKeys: string[],
    nameLabelKeys: string[],
    clusterInfo: IClusterInfo[],
    namespaces: string[],
    hashIdMap: Map<string, string>
  ): Promise<AppEndpoint[]> {
    // generate endpoints out of cluster information (pods, services)
    const endpointsFromClusterInfo = await this.appUtils.clusterInfoToApp(
      clusterInfo,
      namespaces,
      excludedLabelKeys,
      nameLabelKeys
    );

    const endpointMap = new Map<string, AppEndpoint>();
    const protocolMap = new Map<string, Map<string, Protocol>>();
    // create map of hash->id for existing endpoints and protocols in revision

    // populate endpointMap and protocolMap
    DiscoveryUtils.endpointsToMaps(
      endpointsFromClusterInfo,
      endpointMap,
      protocolMap
    );
    DiscoveryUtils.endpointsToMaps(endpoints, endpointMap, protocolMap);
    return [...endpointMap].map(entry => {
      const [endpointHash, endpoint] = entry;
      const protocols = protocolMap.get(endpointHash);
      return {
        ...endpoint,
        // preserve old endpoint id or use new hash if no id exited before in the app
        id: hashIdMap.get(endpointHash) || endpointHash,
        protocols: (protocols ? [...protocols.values()] : []).map(protocol => {
          const protocolHash = DiscoveryUtils.protocolHash(
            endpointHash,
            protocol.l34Protocol,
            protocol.port
          );
          return {
            ...protocol,
            // TODO: maybe add functions here?
            id: hashIdMap.get(protocolHash) || protocolHash
          };
        })
      };
    });
  }

  /**
   * Takes existing endpoints and
   * adds more functions from EndpointElements
   *
   * this function doesn't create new endpoint
   * since endpoints can only be created from clusterInfo
   *
   * this function also doesn't create new protocols
   * if this protocols didn't exist before (from clusterInfo)
   */
  public async updateEndpointsFromFlows(
    endpoints: AppEndpoint[],
    excludedLabelKeys: string[],
    nameLabelKeys: string[],
    flows: Array<Flow>,
    namespaces: string[],
    clusterIps: Set<string>,
    context: IContext,
    preparedHashIdMap?: Map<string, string>
  ): Promise<AppEndpoint[]> {
    const endpointMap = new Map<string, AppEndpoint>();
    const protocolMap = new Map<string, Map<string, Protocol>>();
    const functionMap = new Map<string, Map<string, AppFunction>>();
    // create map of hash->id for existing endpoints and protocols in revision
    const hashIdMap = preparedHashIdMap || DiscoveryUtils.hashIdMap(endpoints);

    DiscoveryUtils.endpointsToMaps(
      endpoints,
      endpointMap,
      protocolMap,
      functionMap
    );

    const flowElements: EndpointElement[] = [];
    flows.map(flow => {
      const isL7Flow = Boolean((flow as Flow).destinationL7Protocol);

      const { source, destination } = DiscoveryUtils.getEndpointsFromFlow(
        endpoints,
        excludedLabelKeys,
        nameLabelKeys,
        flow,
        namespaces
      );

      if (isCidrEndpoint(destination)) {
        destination.protocols.forEach(proto => {
          flowElements.push(new EndpointElement(destination, proto, null));
          (proto.functions || []).forEach(func => {
            flowElements.push(new EndpointElement(destination, proto, func));
          });
        });
        return;
      }

      // add all new discovered destination endpoints to the app model
      // except reserved world endpoint
      if (!endpointMap.has(destination.id)) {
        endpointMap.set(destination.id, destination);
        protocolMap.set(destination.id, new Map());
      }

      // only add source endpoints when destination endpoint exists in the map
      // skips protocols that were not created by user or from cluster information
      // we don't create protocols from flow information

      const endpointProtocolMap = protocolMap.get(destination.id)!;
      const protocolFromFlow = destination.protocols[0]!;
      const flowProtocolHash = protocolFromFlow.id;
      // if (!endpointProtocolMap) {
      //   protocolMap.set(destination.id, new Map());
      //   endpointProtocolMap = protocolMap.get(destination.id)!;
      // }
      // Adds new protocol to destination endpoint if it's cidr, dns or world
      if (
        !endpointProtocolMap.has(flowProtocolHash) &&
        (isCidrEndpoint(destination) ||
          isReservedWorldLabels(destination.labels) ||
          destination.type == AppEndpointType.DNS)
      ) {
        endpointProtocolMap.set(flowProtocolHash, protocolFromFlow);
      }

      if (
        !endpointProtocolMap.has(flowProtocolHash) &&
        (destination.type === AppEndpointType.OUTSIDE_MANAGED ||
          isReservedClusterLabels(destination.labels)) &&
        !inDynamicPortRange(protocolFromFlow.port!)
      ) {
        endpointProtocolMap.set(flowProtocolHash, protocolFromFlow);
      }

      // Skips protocol for all other endpoints
      if (!endpointProtocolMap.has(flowProtocolHash)) {
        context.logger.trace(
          { flow, destination },
          "Protocol from flow was not found in the app model"
        );
        return;
      }

      // Adds new source endpoints into the map
      if (!endpointMap.has(source.id)) {
        endpointMap.set(source.id, source);
        protocolMap.set(source.id, new Map());
      }
      // Use source app endpoint definitions from the app model
      // it will preserve right id that will be used in allowedSources
      const sourceAppEndpoint = endpointMap.get(source.id)!;
      const functionFromFlow = protocolFromFlow.functions![0]!;
      const protocolFromApp = endpointProtocolMap.get(flowProtocolHash)!;
      const allowedSourcesFromFlow = [sourceAppEndpoint.id];
      // Specially handle l7 flows
      if (isL7Flow && protocolFromApp.l7Protocol) {
        if (!functionMap.has(flowProtocolHash)) {
          functionMap.set(flowProtocolHash, new Map());
        }
        const funcMap = functionMap.get(flowProtocolHash)!;
        const flowFunctionHash = functionFromFlow.id;
        if (funcMap.has(flowFunctionHash)) {
          const functionFromApp = funcMap.get(flowFunctionHash)!;
          functionFromApp.allowedSources = [
            ...new Set([
              ...functionFromApp.allowedSources,
              ...allowedSourcesFromFlow
            ])
          ];
        } else {
          if (!protocolFromApp.functions) {
            protocolFromApp.functions = [];
          }
          const newFunc = {
            ...functionFromFlow,
            allowedSources: allowedSourcesFromFlow
          };
          protocolFromApp.functions = [...protocolFromApp.functions, newFunc];
          funcMap.set(flowFunctionHash, newFunc);
        }
      } else {
        // l34 flow
        protocolFromApp.allowedSources = [
          ...new Set([
            ...protocolFromApp.allowedSources,
            ...allowedSourcesFromFlow
          ])
        ];
      }
      destination.protocols.forEach(proto => {
        flowElements.push(new EndpointElement(destination, proto, null));
        (proto.functions || []).forEach(func => {
          flowElements.push(new EndpointElement(destination, proto, func));
        });
      });
    });

    await handleEgressFlows(
      flowElements,
      endpointMap,
      protocolMap,
      functionMap,
      clusterIps
    );

    return [...endpointMap].map(entry => {
      const [endpointHash, endpoint] = entry;
      const protocols = protocolMap.get(endpointHash);
      return {
        ...endpoint,
        // preserve old endpoint id or use new hash if no id exited before in the app
        id: hashIdMap.get(endpointHash) || endpointHash,
        protocols: (protocols ? [...protocols.values()] : []).map(protocol => {
          const protocolHash = DiscoveryUtils.protocolHash(
            endpointHash,
            protocol.l34Protocol,
            protocol.port
          );
          return {
            ...protocol,
            functions: functionMap.has(protocolHash)
              ? [...functionMap.get(protocolHash)!.values()]
              : [],
            id: hashIdMap.get(protocolHash) || protocolHash
          };
        })
      };
    });
  }
}
