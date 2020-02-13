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
import * as hash from "object-hash";
import { getEndpointAndProtocolForEgress } from "./cidr";
import { K8sPod } from "./collector_service_pb";
import { IClusterInfo } from "./configDb";
import { EndpointElement } from "./endpointElement";
import {
  AppEndpoint,
  AppEndpointType,
  AppFunction,
  Endpoint,
  Label,
  Protocol
} from "./graphqlTypes";
import { labelsToSelector } from "./policy";
import {
  getElasticSearchRules,
  getGRPCRules,
  getHttpRules,
  getNewRewriteRuleId
} from "./rewriteRules";
import { isWildcardDNS } from "./shared/builders";
import {
  isReservedClusterLabels,
  isReservedWorldLabels
} from "./shared/checkers";
import { NAMESPACE_LABEL } from "./shared/constants";
import { findNameLabelValue } from "./shared/finders";
import { getEndpointHash } from "./shared/generators";
import { WORLD_ENDPOINT } from "./shared/misc";
import { getL7Protocol, portToAppProtocolTuple } from "./shared/portMapping";
import { IContext } from "./types";
import { isCidrEndpoint, protocolWithId } from "./utils";

function updateWorldEndpointUltimateHackBeyond(
  element: EndpointElement,
  appEndpointMap: Map<string, AppEndpoint>,
  appProtocolMap: Map<string, Map<string, Protocol>>
) {
  const worldElement = new EndpointElement(WORLD_ENDPOINT, null, null);
  const protocolMap = appProtocolMap.get(worldElement.endpointHash());
  if (!protocolMap) {
    return;
  }
  [...protocolMap.entries()].forEach(entry => {
    const [key, protocol] = entry;
    if (
      element.protocol &&
      protocol.l34Protocol === element.protocol.l34Protocol &&
      protocol.port === element.protocol.port
    ) {
      const elementProtocol = element.protocol as Protocol;
      const sources = protocol.allowedSources.filter(
        src => !elementProtocol.allowedSources.includes(src)
      );
      if (sources.length === 0) {
        protocolMap.delete(key);
        if (protocolMap.size === 0) {
          appProtocolMap.delete(worldElement.endpointHash());
        }
      } else {
        protocolMap.set(element.protocolHash(), {
          ...protocol,
          allowedSources: protocol.allowedSources.filter(
            src => !elementProtocol.allowedSources.includes(src)
          )
        });
      }
    }
  });
}

function updateMaps(
  newElement: EndpointElement,
  appEndpointMap: Map<string, AppEndpoint>,
  appProtocolMap: Map<string, Map<string, Protocol>>,
  appFunctionMap: Map<string, Map<string, AppFunction>>
) {
  const newProtocol = newElement.protocol as Protocol;
  appEndpointMap.set(newElement.endpointHash(), newElement.endpoint);
  if (!appProtocolMap.has(newElement.endpointHash())) {
    appProtocolMap.set(newElement.endpointHash(), new Map<string, Protocol>());
  }

  const protocolMap = appProtocolMap.get(newElement.endpointHash()) as Map<
    string,
    Protocol
  >;
  const protocol = protocolMap.get(newElement.protocolHash());
  if (protocol) {
    protocolMap.set(newElement.protocolHash(), {
      ...protocol,
      allowedSources: [
        ...new Set([
          ...(newProtocol.allowedSources || []),
          ...(protocol.allowedSources || [])
        ])
      ]
    });
  } else {
    protocolMap.set(newElement.protocolHash(), newProtocol);
  }
  if (!newElement.func) {
    return;
  }
  if (!appFunctionMap.has(newElement.protocolHash())) {
    appFunctionMap.set(
      newElement.protocolHash(),
      new Map<string, AppFunction>()
    );
  }
  appFunctionMap
    .get(newElement.protocolHash())!
    .set(newElement.functionHash(), newElement.func!);
}

export async function handleEgressFlows(
  flowElements: EndpointElement[],
  appEndpointMap: Map<string, AppEndpoint>,
  appProtocolMap: Map<string, Map<string, Protocol>>,
  appFunctionMap: Map<string, Map<string, AppFunction>>,
  clusterIps: Set<string>
) {
  await Promise.all(
    flowElements
      .filter(
        element =>
          element.protocol &&
          (element.protocol.l34Protocol === "TCP" ||
            element.protocol.l34Protocol === "UDP")
      )
      .map(async element => {
        if (isReservedClusterLabels(element.endpoint.labels)) {
          updateMaps(element, appEndpointMap, appProtocolMap, appFunctionMap);
        } else if (isReservedWorldLabels(element.endpoint.labels)) {
          if (
            (element.endpoint.v4Cidrs &&
              element.endpoint.v4Cidrs.length === 1 &&
              !clusterIps.has(element.endpoint.v4Cidrs[0])) ||
            (element.endpoint.v6Cidrs &&
              element.endpoint.v6Cidrs.length === 1 &&
              !clusterIps.has(element.endpoint.v6Cidrs[0]))
          ) {
            const { newElement, fromApp } = getEndpointAndProtocolForEgress(
              element,
              appEndpointMap
            );
            if (fromApp) {
              updateWorldEndpointUltimateHackBeyond(
                newElement,
                appEndpointMap,
                appProtocolMap
              );
            }
            updateMaps(
              newElement,
              appEndpointMap,
              appProtocolMap,
              appFunctionMap
            );
          }
        } else if (element.endpoint.type === AppEndpointType.OUTSIDE_MANAGED) {
          if (!appProtocolMap.has(element.endpointHash())) {
            appProtocolMap.set(
              element.endpointHash(),
              new Map<string, Protocol>()
            );
          }
          const protoMap = appProtocolMap.get(element.endpointHash()) as Map<
            string,
            Protocol
          >;
          if (!protoMap.has(element.protocolHash())) {
            protoMap.set(element.protocolHash(), {
              ...(element.protocol as Protocol),
              applicationProtocol: element.protocol!.l7Protocol
            });
          } else {
            const currentProtocol = protoMap.get(element.protocolHash())!;
            const allowedSources: string[] = [
              ...new Set([
                ...(element.protocol!.allowedSources || []),
                ...(currentProtocol.allowedSources || [])
              ])
            ];
            protoMap.set(element.protocolHash(), {
              ...currentProtocol,
              allowedSources
            });
          }
        }
      })
  );
}

/**
 * Magic function that "flattens" endpoint->protocol->function structure
 * of app model into Map of EndpointElements
 * Each endpoint->protocol->function produces 3 EndpointElements:
 *  EndpointElement(endpoint, null, null)
 *  EndpointElement(endpoint, endpoint->protocol, null)
 *  EndpointElement(endpoint, endpoint->protocol, endpoint->protocol->function)
 *
 * This map of endpoints is used later in diff functions
 */
export function flattenEndpoints(
  endpoints: AppEndpoint[],
  protocolOrFunction?: boolean
): Map<string, EndpointElement> {
  return endpoints.reduce((accum, endpoint) => {
    const endpointElement = new EndpointElement(
      { ...endpoint, protocols: [] },
      null,
      null
    );
    accum.set(endpointElement.hash(), endpointElement);
    endpoint.protocols.reduce((accum, protocol) => {
      const protocolEndpointElement = new EndpointElement(
        endpointElement.endpoint,
        { ...protocol, functions: [] },
        null
      );
      if (
        !protocolOrFunction ||
        !protocol.functions ||
        !protocol.functions.length
      ) {
        accum.set(protocolEndpointElement.hash(), protocolEndpointElement);
      }
      if (protocol.functions) {
        protocol.functions.reduce((accum, func) => {
          const funcEndpointElement = new EndpointElement(
            endpointElement.endpoint,
            protocolEndpointElement.protocol,
            func
          );
          accum.set(funcEndpointElement.hash(), funcEndpointElement);
          return accum;
        }, accum);
      }
      return accum;
    }, accum);
    return accum;
  }, new Map<string, EndpointElement>());
}

function getEgressDestinationSelector(endpoint: AppEndpoint): any {
  if (endpoint.type === AppEndpointType.DNS) {
    const dnsName: string = endpoint.dnsName || endpoint.name;
    return {
      toFQDNs: [
        isWildcardDNS(dnsName)
          ? {
              matchPattern: dnsName
            }
          : {
              matchName: dnsName
            }
      ]
    };
  } else if (isCidrEndpoint(endpoint)) {
    return {
      toCIDR: [
        ...(endpoint.v4Cidrs || [])
          .concat(endpoint.v6Cidrs || [])
          .reduce((accum, cidr) => {
            accum.add(cidr);
            return accum;
          }, new Set<string>())
      ]
    };
  } else {
    return {
      toEndpoints: [
        {
          matchLabels: labelsToSelector(endpoint.labels)
        }
      ]
    };
  }
}

function getEgressL4Rule(
  destination: AppEndpoint,
  elements: EndpointElement[]
): any {
  return {
    ...getEgressDestinationSelector(destination),
    toPorts: [
      {
        ports: elements.map(element => {
          const protocol = element.protocol as Protocol;
          return {
            port: String(protocol.port),
            protocol: protocol.l34Protocol
          };
        })
      }
    ]
  };
}

export function getDeploymentUrl(
  deploymentId: string,
  context: IContext
): string {
  return `${context.hostname}/deployments/${deploymentId}`;
}

export function getVisibilityRule(
  l7Protocol: string,
  ports: [{ port: string; protocol: string }]
) {
  l7Protocol = l7Protocol === "grpc" ? "http" : l7Protocol;
  return {
    fromEntities: ["all"],
    toPorts: [
      {
        ports: ports,
        rules: {
          [l7Protocol]:
            l7Protocol === "kafka" || l7Protocol === "http" ? [{}] : []
        }
      }
    ]
  };
}

export function getEgressVisibilityRule(
  endpoint: AppEndpoint,
  l7Protocol: string,
  ports: [{ port: string; protocol: string }]
) {
  l7Protocol = l7Protocol === "grpc" ? "http" : l7Protocol;
  const dnsName: string = endpoint.dnsName || endpoint.name;
  return {
    ...(endpoint.type === AppEndpointType.DNS
      ? {
          toFQDNs: [
            isWildcardDNS(dnsName)
              ? {
                  matchPattern: dnsName
                }
              : {
                  matchName: dnsName
                }
          ]
        }
      : {
          toCIDR: (endpoint.v4Cidrs || []).concat(endpoint.v6Cidrs || [])
        }),
    toPorts: [
      {
        ports: ports,
        rules: {
          [l7Protocol]: l7Protocol === "http" ? [{}] : []
        }
      }
    ]
  };
}

function getPortRules(
  endpoint: EndpointElement,
  appId: string,
  appVersion: string,
  idGenerator?: () => string
): any[] {
  const protocol = endpoint.protocol as Protocol;
  return [
    {
      ports: [
        {
          port: String(protocol.port),
          protocol: String(protocol.l34Protocol)
        }
      ],
      rules: {
        ...(protocol.l7Protocol === "http"
          ? {
              http:
                protocol.applicationProtocol === "elasticsearch"
                  ? getElasticSearchRules(appId, appVersion, idGenerator)
                  : getHttpRules(appId, appVersion, idGenerator)
            }
          : protocol.l7Protocol === "grpc"
          ? {
              http: getGRPCRules(appId, appVersion, idGenerator)
            }
          : {
              [protocol.l7Protocol as string]: [
                {
                  id: getNewRewriteRuleId(appId, appVersion, idGenerator)
                }
              ]
            })
      }
    }
  ];
}

export class AppUtils {
  constructor(private readonly logger: bunyan) {}

  private async reduceClusterInfoWithPodList(
    clusterInfo: IClusterInfo[],
    namespaces: string[],
    excludedLabelKeys: string[]
  ): Promise<IClusterEndpoints> {
    const idMap = new Map<string, string>();

    const endpointMap = clusterInfo.reduce((accum, curr) => {
      JSON.parse(curr.endpoints).map(endpoint => {
        let namespace;
        const labels = endpoint.labels
          .map(
            (label: string): Label => {
              const [key, value] = label.split("=", 2);
              if (!value) {
                this.logger.warn({ label, endpoint }, "label without value");
                return { key, value: "" };
              }
              if (key === NAMESPACE_LABEL) {
                namespace = namespaces.find(ns => ns == value);
              }
              return { key, value };
            }
          )
          .filter(label => !excludedLabelKeys.find(key => key === label.key));
        if (namespaces.find(ns => ns == namespace)) {
          accum.set(hash(labels), { name: "", labels });
          idMap.set(String(endpoint.id), hash(labels));
        }
      });
      return accum;
    }, new Map<string, Endpoint>());

    const pods = clusterInfo.reduce((accum, curr) => {
      curr.podList.getPodsList().map(pod => {
        if (!pod.hasMetadata()) {
          return;
        }
        const cep = curr.cep.filter(
          cep =>
            cep.name == pod.getMetadata()!.getName() &&
            cep.namespace == pod.getMetadata()!.getNamespace()
        );
        if (cep.length == 0) {
          return;
        }
        const endpointId = idMap.get(cep[0].identityId);
        if (!endpointId) {
          return;
        }
        accum.set(pod.getMetadata()!.getUid(), pod);
      });
      return accum;
    }, new Map<string, K8sPod>());
    const podMap = [...pods.entries()].reduce((accum, curr) => {
      const cep = clusterInfo[0].cep.filter(
        cep =>
          cep.name == curr[1].getMetadata()!.getName() &&
          cep.namespace == curr[1].getMetadata()!.getNamespace()
      );
      if (cep.length == 0) {
        return accum;
      }
      const endpointId = idMap.get(cep[0].identityId);
      if (!endpointId) {
        return accum;
      }
      const podList = accum.get(endpointId);
      accum.set(endpointId, podList ? podList.concat(curr[1]) : [curr[1]]);
      return accum;
    }, new Map<string, any[]>());
    return {
      idMap,
      endpointMap,
      podMap
    };
  }

  private async getServiceInfo(
    clusterInfo: IClusterInfo[]
  ): Promise<Map<string, IService[]>> {
    return clusterInfo.reduce((accum, curr) => {
      try {
        const endpoints = JSON.parse(curr.k8sEndpoints);
        endpoints.items.forEach(endpoint => {
          const ports = (endpoint.subsets || []).reduce((accum, curr) => {
            curr.ports &&
              curr.ports.forEach(port => {
                const name = port.port.toString();
                if (name) {
                  accum.set(name, {
                    name,
                    port: port.port,
                    protocol: port.protocol,
                    l7Protocol: getL7Protocol(name)
                  });
                }
              });
            return accum;
          }, new Map<string, IPort>());
          (endpoint.subsets || []).forEach(curr => {
            (curr.addresses || []).forEach(address => {
              if (address.targetRef && address.targetRef.kind === "Pod") {
                // A single container may be associated to more than
                // one service.
                const iService = [
                  {
                    name: endpoint.metadata.name,
                    namespace: endpoint.metadata.namespace,
                    ports: [...ports.values()]
                  }
                ];
                const existingIServices = accum.get(address.targetRef.uid);
                if (existingIServices) {
                  iService.push(...existingIServices);
                }
                accum.set(address.targetRef.uid, iService);
              }
            });
          });
        });
      } catch (error) {
        this.logger.warn(error);
      }
      return accum;
    }, new Map<string, IService[]>());
  }

  private async getProtocolMapWithPodList(
    clusterEndpoints: IClusterEndpoints,
    services: Map<string, IService[]>
  ): Promise<[Map<string, string>, Map<string, Protocol[]>]> {
    const nameMap = new Map<string, string>();
    const protocolMap = [...clusterEndpoints.podMap.entries()].reduce(
      (accum, curr) => {
        const identity = curr[0];
        const protocols = curr[1].reduce((accum, curr) => {
          curr
            .getSpec()!
            .getContainersList()
            .forEach(container => {
              nameMap.set(identity, container.getName());
            });
          const service = services.get(curr.getMetadata()!.getUid());
          if (service) {
            service.forEach(s => {
              s.ports.map(port => {
                const [
                  l7Protocol,
                  applicationProtocol
                ] = portToAppProtocolTuple(port.port, port.l7Protocol);
                const protocol = protocolWithId(
                  { id: identity } as AppEndpoint,
                  {
                    l34Protocol: port.protocol,
                    allowedSources: [],
                    allowedSourcesDisabled: [],
                    port: port.port,
                    l7Protocol,
                    applicationProtocol,
                    httpRewriteRules: [],
                    functions: []
                  }
                );
                accum.set(protocol.id, protocol);
              });
            });
          } else {
            curr
              .getSpec()!
              .getContainersList()
              .map(container => {
                container.getPortsList()!.map(port => {
                  const [
                    l7Protocol,
                    applicationProtocol
                  ] = portToAppProtocolTuple(port.getContainerPort());

                  const protocol = protocolWithId(
                    { id: identity } as AppEndpoint,
                    {
                      l34Protocol: port.getProtocol(),
                      allowedSources: [],
                      allowedSourcesDisabled: [],
                      port: port.getContainerPort(),
                      l7Protocol,
                      applicationProtocol,
                      httpRewriteRules: [],
                      functions: []
                    }
                  );
                  accum.set(protocol.id, protocol);
                });
              });
          }
          return accum;
        }, new Map<string, Protocol>());
        accum.set(curr[0], [...protocols.values()]);
        return accum;
      },
      new Map<string, Protocol[]>()
    );
    return [nameMap, protocolMap];
  }

  public async getClusterIps(
    clusterInfo: IClusterInfo[]
  ): Promise<Set<string>> {
    return clusterInfo.reduce((accum, curr) => {
      try {
        const services = JSON.parse(curr.services);
        (services.items || []).forEach(service => {
          if (
            service.spec &&
            service.spec.clusterIP &&
            service.spec.clusterIP !== "None"
          ) {
            accum.add(service.spec.clusterIP);
          }
        });
      } catch (error) {
        this.logger.warn(error);
      }
      return accum;
    }, new Set<string>());
  }

  public async clusterInfoToApp(
    clusterInfo: IClusterInfo[],
    namespaces: string[],
    excludedLabelKeys: string[],
    nameLabelKeys: string[]
  ): Promise<AppEndpoint[]> {
    const services = await this.getServiceInfo(clusterInfo);
    const clusterEndpoints = await this.reduceClusterInfoWithPodList(
      clusterInfo,
      namespaces,
      excludedLabelKeys
    );
    const [nameMap, protocolMap] = await this.getProtocolMapWithPodList(
      clusterEndpoints,
      services
    );
    this.logger.trace(
      {
        names: [...nameMap.entries()],
        endpoints: [...clusterEndpoints.endpointMap.entries()],
        protocols: [...protocolMap.entries()],
        services: [...services.entries()]
      },
      "Endpoints from ClusterInfo"
    );
    return [...clusterEndpoints.endpointMap.entries()].map(
      (entry): AppEndpoint => {
        const endpointName =
          findNameLabelValue(nameLabelKeys, entry[1].labels) ||
          nameMap.get(entry[0]) ||
          "";
        return {
          ...entry[1],
          id: getEndpointHash(entry[1].labels),
          name: endpointName,
          protocols: protocolMap.get(entry[0]) || [],
          disabled: false,
          v4Cidrs: [],
          v6Cidrs: [],
          __typename: "AppEndpoint"
        };
      }
    );
  }
}

interface IClusterEndpoints {
  readonly idMap: Map<string, string>;
  readonly endpointMap: Map<string, Endpoint>;
  readonly podMap: Map<string, any[]>;
}

interface IPort {
  readonly name: string;
  readonly port: number;
  readonly protocol: string;
  readonly l7Protocol: string;
}

interface IService {
  readonly name: string;
  readonly namespace: string;
  readonly ports: IPort[];
}
