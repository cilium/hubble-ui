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
import * as yaml from "js-yaml";
import {
  AppEndpoint,
  AppFunction,
  CiliumNetworkPolicy,
  Endpoint,
  Label,
  PolicySpecs,
  PolicySpecsFilterInput,
  PolicyTypeEnum,
  Protocol
} from "./graphqlTypes";
import { findNamespaceFromLabels } from "./shared/finders";
import { IContext } from "./types";

// https://docs.cilium.io/en/v1.5/concepts/#label-source
export enum CiliumLabelSource {
  Container = "container",
  K8s = "k8s",
  Mesos = "mesos",
  Reserved = "reserved",
  Unspec = "unspec"
}

export function getL7RulesForProtocol(
  endpoint: AppEndpoint,
  protocol: Protocol,
  enforcementEndpointMap: Map<string, AppEndpoint>
): any[] {
  const sourceMap = new Map<String, AppEndpoint>();
  const funcMap = new Map<String, AppFunction[]>();
  // each allowedSource is an id of an endpoint
  // use enforcementEndpointMap to resolve this list to a map of source endpoints
  (protocol.functions || []).forEach(func => {
    func.allowedSources.forEach(srcId => {
      if (enforcementEndpointMap.has(srcId)) {
        sourceMap.set(srcId, enforcementEndpointMap.get(srcId)!);
      }
      const funcList = funcMap.get(srcId);
      if (funcList) {
        funcMap.set(srcId, funcList.concat([func]));
      } else {
        funcMap.set(srcId, [func]);
      }
    });
  });
  return [...funcMap.entries()]
    .filter(([srcId, funcList]) => sourceMap.has(srcId))
    .map(([srcId, funcList]) => {
      const srcEndpoint = sourceMap.get(srcId)!;
      return {
        fromEndpoints: [getEndpointSelector(srcEndpoint)],
        toPorts: [
          {
            ports: [
              {
                port: String(protocol.port),
                protocol: protocol.l34Protocol
              }
            ],
            rules: getL7Rule(protocol, funcList)
          }
        ]
      };
    })
    .concat(
      protocol.l7Protocol === "kafka"
        ? ([
            {
              fromEndpoints: [getEndpointSelector(endpoint)],
              toPorts: [
                {
                  ports: [
                    {
                      port: String(protocol.port),
                      protocol: protocol.l34Protocol
                    }
                  ],
                  rules: {
                    kafka: [
                      {
                        apiKey: "",
                        topic: ""
                      }
                    ]
                  }
                }
              ]
            }
          ] as any)
        : []
    );
}

export function getL7AllowAllRule(protocol: Protocol): any {
  if (protocol.l7Protocol === "http" || protocol.l7Protocol === "grpc") {
    return { http: [{}] };
  } else if (protocol.l7Protocol === "kafka") {
    return { kafka: [{}] };
  } else {
    return {};
  }
}

export function getL7AllowAllRulesForProtocol(
  endpoint: AppEndpoint,
  protocol: Protocol,
  enforcementEndpointMap: Map<string, AppEndpoint>
): any[] {
  const sourceMap = new Map<String, AppEndpoint>();
  (protocol.functions || []).forEach(func => {
    func.allowedSources.forEach(srcId => {
      if (enforcementEndpointMap.has(srcId)) {
        sourceMap.set(srcId, enforcementEndpointMap.get(srcId)!);
      }
    });
  });
  const rules = getL7AllowAllRule(protocol);
  return [...sourceMap.values()]
    .map((srcEndpoint): any => {
      return {
        fromEndpoints: [getEndpointSelector(srcEndpoint)],
        toPorts: [
          {
            ports: [
              {
                port: String(protocol.port),
                protocol: protocol.l34Protocol
              }
            ],
            ...(Object.keys(rules).length > 0 ? { rules } : {})
          }
        ]
      };
    })
    .concat(
      protocol.l7Protocol === "kafka"
        ? [
            {
              fromEndpoints: [getEndpointSelector(endpoint)],
              toPorts: [
                {
                  ports: [
                    {
                      port: String(protocol.port),
                      protocol: protocol.l34Protocol
                    }
                  ],
                  rules: {
                    kafka: [{}]
                  }
                }
              ]
            }
          ]
        : []
    );
}

export function labelsToSelector(labels: Label[]): object {
  return labels.reduce((acc, val) => {
    acc[val.key] = val.value;
    return acc;
  }, {});
}

export function getEndpointSelector(endpoint: AppEndpoint | Endpoint): any {
  return {
    matchLabels: {
      ...labelsToSelector(endpoint.labels)
    }
  };
}

export function getL7Rule(protocol: Protocol, funcList: AppFunction[]) {
  if (protocol.l7Protocol === "http" || protocol.l7Protocol === "grpc") {
    return {
      http: funcList.map(func => {
        const [method, path] = func.name.split(" ", 2);
        return {
          method: `${method}`,
          path: `${path}`
        };
      })
    };
  } else if (protocol.l7Protocol === "kafka") {
    return {
      kafka: funcList
        .map(func => {
          const [apiKey, apiVersion, topic] = func.name.split(" ", 3);
          return apiKey === "produce"
            ? [
                {
                  role: apiKey,
                  topic
                }
              ]
            : apiKey === "fetch"
            ? [
                {
                  role: "consume",
                  topic
                }
              ]
            : [];
        })
        .reduce((accum, curr) => accum.concat(curr), [])
    };
  } else {
    return {};
  }
}

/**
 * Returns array of ids of allowed sources for endpoint and protocol
 * Functions allowed sources take precedence
 * For kafka we add itself as an allowed source
 */
export function getAllowedSourceEndpoints(
  endpoint: AppEndpoint,
  protocol: Protocol,
  enforcementEndpointMap: Map<string, AppEndpoint>,
  includeFunctionSources: boolean
): Endpoint[] {
  const kafkaEndpoint = protocol.l7Protocol === "kafka" ? endpoint : null;
  const functionSources = (protocol.functions || []).reduce((accum, curr) => {
    curr.allowedSources.forEach(source => {
      accum.add(source);
    });
    return accum;
  }, new Set<string>());
  const protocolSources = protocol.allowedSources.reduce((accum, curr) => {
    if (!functionSources.has(curr)) {
      accum.add(curr);
    }
    return accum;
  }, new Set<string>());
  const sources =
    includeFunctionSources &&
    protocol.functions &&
    protocol.functions.length > 0
      ? functionSources
      : protocolSources;
  if (!includeFunctionSources && kafkaEndpoint) {
    sources.delete(kafkaEndpoint.id);
  } else if (kafkaEndpoint && !protocolSources.has(kafkaEndpoint.id)) {
    sources.add(kafkaEndpoint.id);
  }
  return [...sources]
    .filter(sourceId => enforcementEndpointMap.has(sourceId))
    .map(sourceId => enforcementEndpointMap.get(sourceId)!) as Endpoint[];
}

export function getSourceEndpointSelectors(sources: Endpoint[]) {
  return sources.map(src => {
    return getEndpointSelector(src);
  });
}

function getL4RulesForProtocol(
  endpoint: AppEndpoint,
  protocol: Protocol,
  enforcementEndpointMap: Map<string, AppEndpoint>,
  includeFunctionSources: boolean
): any[] {
  const allowedSourceEndpoints = getAllowedSourceEndpoints(
    endpoint,
    protocol,
    enforcementEndpointMap,
    includeFunctionSources
  );
  return allowedSourceEndpoints.length > 0
    ? ([
        {
          fromEndpoints: getSourceEndpointSelectors(allowedSourceEndpoints),
          toPorts: [
            {
              ports: [
                {
                  port: String(protocol.port),
                  protocol: protocol.l34Protocol
                }
              ]
            }
          ]
        }
      ] as any[])
    : [];
}

export function removePrefixFromLabel(label: Label, keyPrefix: string): Label {
  return {
    key: label.key.startsWith(keyPrefix)
      ? label.key.substr(keyPrefix.length)
      : label.key,
    value: label.value
  };
}

export function filterSpecs(
  cnp: CiliumNetworkPolicy[],
  filter: PolicySpecsFilterInput,
  context: IContext
): PolicySpecs[] {
  const namespace = findNamespaceFromLabels(filter.labels || []);
  return cnp.reduce((accum, curr) => {
    try {
      if (filter.labels && curr.namespace !== namespace) {
        return accum;
      }
      const data = yaml.safeLoad(curr.yaml);
      if (data.spec && data.spec.podSelector) {
        const ingressSpecs = filterPolicySpecs(
          [data.spec],
          filter,
          "podSelector",
          "ingress"
        );
        const egressSpecs = filterPolicySpecs(
          [data.spec],
          filter,
          "podSelector",
          "egress"
        );
        if (ingressSpecs.length > 0 || egressSpecs.length > 0) {
          accum.push({
            policyNamespace: curr.namespace,
            policyName: curr.name,
            type: PolicyTypeEnum.KUBERNETES_NETWORK_POLICY,
            ingressSpecs,
            egressSpecs
          });
        }
      } else {
        const specList =
          data.specs && Array.isArray(data.specs)
            ? data.specs
            : data.spec && data.spec.endpointSelector
            ? [data.spec]
            : [];
        const ingressSpecs = filterPolicySpecs(
          specList,
          filter,
          "endpointSelector",
          "ingress"
        );
        const egressSpecs = filterPolicySpecs(
          specList,
          filter,
          "endpointSelector",
          "egress"
        );
        if (ingressSpecs.length > 0 || egressSpecs.length > 0) {
          accum.push({
            policyNamespace: curr.namespace,
            policyName: curr.name,
            type: PolicyTypeEnum.CILIUM_NETWORK_POLICY,
            ingressSpecs,
            egressSpecs
          });
        }
      }
    } catch (err) {
      context.logger.error(
        { err, policy: curr },
        `Failed to process network policy`
      );
    }
    return accum;
  }, [] as PolicySpecs[]);
}

export function updateEndpointsWithIngressEgress(
  clusterId: string,
  cnp: CiliumNetworkPolicy[],
  endpoints: AppEndpoint[],
  context: IContext
): AppEndpoint[] {
  const yamlCache: { [key: string]: any } = {};
  return endpoints.map(endpoint =>
    updateEndpointWithIngressEgress(
      clusterId,
      cnp,
      endpoint,
      yamlCache,
      context
    )
  );
}

export function updateEndpointWithIngressEgress(
  clusterId: string,
  cnp: CiliumNetworkPolicy[],
  endpoint: AppEndpoint,
  yamlCache: { [key: string]: any },
  context: IContext
): AppEndpoint {
  const filter: PolicySpecsFilterInput = {
    clusterId: clusterId,
    labels: endpoint.labels
  };

  const namespace = findNamespaceFromLabels(filter.labels || []);

  const mappedEndpoint = { ...endpoint };

  const cnpCount = cnp.length;
  for (let cnpIdx = 0; cnpIdx < cnpCount; cnpIdx += 1) {
    const currCnp = cnp[cnpIdx];
    try {
      if (filter.labels && currCnp.namespace !== namespace) {
        continue;
      }

      // try to find parsed yaml in cache or process new one and update cache
      const yamlCacheKey = `${currCnp.namespace}:${currCnp.name}:${currCnp.creationTimestamp}`;
      const parsedYaml = yamlCache[yamlCacheKey]
        ? yamlCache[yamlCacheKey]
        : yaml.safeLoad(currCnp.yaml);
      yamlCache[yamlCacheKey] = parsedYaml;

      const specList =
        parsedYaml.specs && Array.isArray(parsedYaml.specs)
          ? parsedYaml.specs
          : parsedYaml.spec && parsedYaml.spec.endpointSelector
          ? [parsedYaml.spec]
          : [];

      const ingressSpecs = filterPolicySpecs(
        specList,
        filter,
        "endpointSelector",
        "ingress"
      );
      const egressSpecs = filterPolicySpecs(
        specList,
        filter,
        "endpointSelector",
        "egress"
      );

      mappedEndpoint.hasIngressPolicyRules = ingressSpecs.length > 0;
      mappedEndpoint.hasEgressPolicyRules = egressSpecs.length > 0;

      // stop when both ingress/egress found
      if (
        mappedEndpoint.hasIngressPolicyRules &&
        mappedEndpoint.hasEgressPolicyRules
      ) {
        break;
      }
    } catch (err) {
      context.logger.error(
        { err, policy: currCnp },
        `Failed to map endpoint with ingress/egress`
      );
    }
  }
  return mappedEndpoint;
}

export function removeCiliumSourcePrefix(labelKey: string): string {
  return Object.values(CiliumLabelSource).some(prefix =>
    labelKey.startsWith(`${prefix}:`)
  )
    ? labelKey.substr(labelKey.indexOf(":") + 1)
    : labelKey;
}

const ANY_SOURCE_PREFIX = "any:";
export function compareLabelKeys(labelKeyFromCNP: string, labelKeyFromQuery) {
  const normalizedKey =
    !labelKeyFromCNP.startsWith(ANY_SOURCE_PREFIX) &&
    Object.values(CiliumLabelSource).every(
      prefix => !labelKeyFromCNP.startsWith(`${prefix}:`)
    )
      ? `${ANY_SOURCE_PREFIX}${labelKeyFromCNP}`
      : labelKeyFromCNP;
  return normalizedKey.startsWith(ANY_SOURCE_PREFIX)
    ? normalizedKey.substr(ANY_SOURCE_PREFIX.length) ===
        removeCiliumSourcePrefix(labelKeyFromQuery)
    : normalizedKey === labelKeyFromQuery;
}

function matchLabel(labelKey: string, labelValue: string, labels: Label[]) {
  return labels
    .filter(label => compareLabelKeys(labelKey, label.key))
    .some(label => label.value === labelValue);
}

export function filterPolicySpecs(
  specs: any[],
  filter: PolicySpecsFilterInput,
  selectorKey: string,
  direction: "ingress" | "egress"
): string[] {
  return specs
    .filter(spec => {
      const matchLabels = spec[selectorKey].matchLabels;
      const matchExpressions = spec[selectorKey].matchExpressions;
      return (
        spec[direction] &&
        spec[direction].length > 0 &&
        Object.entries(matchLabels || {}).every(([labelKey, labelValue]) =>
          matchLabel(labelKey, labelValue as string, filter.labels || [])
        ) &&
        (matchExpressions || []).every(expression =>
          evaluateExpression(expression, filter.labels || [])
        )
      );
    })
    .map(spec =>
      yaml.safeDump(
        { [selectorKey]: spec[selectorKey], [direction]: spec[direction] },
        { noRefs: true }
      )
    );
}

export function evaluateExpression(expression: any, labels: Label[]): boolean {
  const filteredLabels = labels.filter(label =>
    compareLabelKeys(expression.key, label.key)
  );
  switch (expression.operator) {
    case "Exists":
      return filteredLabels.length > 0;
    case "DoesNotExist":
      return filteredLabels.length === 0;
    case "In":
      return filteredLabels.some(label =>
        expression.values.includes(label.value)
      );
    case "NotIn":
      return filteredLabels.every(
        label => !expression.values.includes(label.value)
      );
    default:
      throw new Error(`Unknown expression: ${expression}`);
  }
}
