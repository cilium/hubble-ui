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
import * as graphqlFields from "graphql-fields";
import * as hash from "object-hash";
import { AppUtils } from "./app";
import { IClusterInfo } from "./configDb";
import { DiscoveryUtils } from "./discovery";
import {
  AppEndpoint,
  AppFunction,
  Cluster,
  ClusterComponentStatus,
  DashboardCounters,
  DiscoverClusterResult,
  Flow,
  FlowConnection,
  FlowFiltersInput,
  HttpRewriteRule,
  PodStatus,
  PolicySpecs,
  Protocol,
  ProtocolInput,
  UserDashboardCountersArgs,
  UserFlowArgs,
  UserFlowsArgs,
  UserPolicySpecsArgs
} from "./graphqlTypes";
import { filterSpecs, updateEndpointsWithIngressEgress } from "./policy";
import { NAMESPACE_LABEL } from "./shared/constants";
import { protocolId } from "./shared/generators";
import { getL7ProtocolFromApplicationProtocol } from "./shared/portMapping";
import { IClusterSelectedFields, IContext } from "./types";
import uuid = require("uuid");

export async function discoverCluster(
  clusterId: string,
  namespaces: string[] | null | undefined,
  startedAfter: string,
  excludedLabelKeys: string[],
  nameLabelKeys: string[],
  userFilterBy: FlowFiltersInput | null | undefined,
  context: IContext
): Promise<DiscoverClusterResult> {
  const finalNamespaces = namespaces;
  if (!finalNamespaces || finalNamespaces.length > 1) {
    throw new Error(
      "Must specify only one namespace. Multiple namespaces are not supported at the moment."
    );
  }

  const appUtils = new AppUtils(context.logger);
  const discoveryUtils = new DiscoveryUtils(context.logger);
  const cluster = await context.configDatabase.getCluster(
    context,
    clusterId,
    { cnp: true, knp: true },
    finalNamespaces[0]
  );

  const clusterIps = await appUtils.getClusterIps(cluster.clusterInfo);
  const filterBy = {
    ...(userFilterBy || {}),
    clusterId,
    after: startedAfter,
    labels: [
      {
        key: NAMESPACE_LABEL,
        value: finalNamespaces[0]
      }
    ]
  };
  const flowsConnection = await context.database.getFlows(
    context,
    {
      filterBy
    },
    1000000,
    true
  );

  const flows = flowsConnection.edges.map(edge => edge.node);

  let endpoints: AppEndpoint[] = [];
  const discoveredHashMap = DiscoveryUtils.hashIdMap(endpoints);
  endpoints = await discoveryUtils.updateEndpointsFromClusterInfo(
    endpoints,
    excludedLabelKeys,
    nameLabelKeys,
    cluster.clusterInfo,
    finalNamespaces,
    discoveredHashMap
  );
  if (cluster.cluster.cnp) {
    endpoints = updateEndpointsWithIngressEgress(
      clusterId,
      cluster.cluster.cnp,
      endpoints,
      context
    );
  }
  endpoints = await discoveryUtils.updateEndpointsFromFlows(
    endpoints,
    excludedLabelKeys,
    nameLabelKeys,
    flows,
    finalNamespaces,
    clusterIps,
    context,
    discoveredHashMap
  );
  return {
    endpoints,
    responseHash: hash(endpoints)
  };
}

export async function getCovalentPodStatusListWithPodList(
  context: IContext,
  clusterInfo: IClusterInfo[]
): Promise<PodStatus[]> {
  if (clusterInfo.length > 0) {
    const podNameRestartCountsMap: Map<string, number[]> = new Map<
      string,
      number[]
    >();
    try {
      // We always look at the first cluster info, which is supposed to be the
      // latest.
      clusterInfo.forEach(ci => {
        ci.podList.getPodsList().forEach(pod => {
          if (
            pod.hasMetadata() &&
            (pod
              .getMetadata()!
              .getLabelsMap()
              .get("app") === "covalent-exporter" ||
              pod
                .getMetadata()!
                .getLabelsMap()
                .get("app") === "covalent-agent" ||
              pod
                .getMetadata()!
                .getLabelsMap()
                .get("k8s-app") === "cilium") &&
            pod.hasStatus() &&
            pod.getStatus()!.getContainerStatusesList().length > 0
          ) {
            const restartCountList = podNameRestartCountsMap.get(
              pod.getMetadata()!.getName()
            );
            if (restartCountList != undefined) {
              restartCountList.push(
                pod
                  .getStatus()!
                  .getContainerStatusesList()[0]
                  .getRestartCount()
              );
              podNameRestartCountsMap.set(
                pod.getMetadata()!.getName(),
                restartCountList
              );
            } else {
              podNameRestartCountsMap.set(pod.getMetadata()!.getName(), [
                pod
                  .getStatus()!
                  .getContainerStatusesList()[0]
                  .getRestartCount()
              ]);
            }
          }
        });
      });
      return clusterInfo[0].podList
        .getPodsList()
        .filter(
          pod =>
            pod.hasMetadata() &&
            (pod
              .getMetadata()!
              .getLabelsMap()
              .get("app") === "covalent-exporter" ||
              pod
                .getMetadata()!
                .getLabelsMap()
                .get("app") === "covalent-agent" ||
              pod
                .getMetadata()!
                .getLabelsMap()
                .get("k8s-app") === "cilium")
        )
        .map(pod => {
          let status: ClusterComponentStatus = ClusterComponentStatus.UNKNOWN;
          let error: string = "";
          if (pod.hasStatus()) {
            // Set status based on status.phase
            switch (pod.getStatus()!.getPhase()) {
              case "Running":
              case "Succeeded":
                status = ClusterComponentStatus.OK;
                break;
              case "Pending":
                status = ClusterComponentStatus.PENDING;
                break;
              case "Failed":
                status = ClusterComponentStatus.ERROR;
                break;
              default:
                status = ClusterComponentStatus.UNKNOWN;
                break;
            }
            // Update status based on status.conditions
            if (pod.hasStatus()) {
              error = pod
                .getStatus()!
                .getConditionsList()
                // Possible values for conditions: PodScheduled, Ready, Initialized, and Unschedulable.
                .filter(condition => condition.getStatus() === "False")
                .reduce((accum, curr) => {
                  // One of the containers is not healthy. Update overall status.
                  status = ClusterComponentStatus.ERROR;
                  accum = accum.concat(curr.getMessage() + "; ");
                  return accum;
                }, "");
            }
          }
          // We'd also like to monitor the restart counts of pods reported by
          // K8s. If the pod is crashing after some time, we do not want to report
          // it as healthy. So, parse the old clusterInfo too.
          // If the status is OK, check the restartCount for this pod.
          if (status === ClusterComponentStatus.OK) {
            const restartCountList = podNameRestartCountsMap.get(
              pod.getMetadata()!.getName()
            );
            const unique = [...new Set(restartCountList)];
            // If the restartCounts haven't changed, the set length should be 1.
            // If we aren't able to read the restart counts due to some reason,
            // the length will be 0.
            if (unique.length > 1) {
              status = ClusterComponentStatus.ERROR;
              error =
                "pod " +
                pod.getMetadata()!.getName() +
                " crash/restarts detected.";
            }
          }
          let version = "latest";
          if (
            pod.hasStatus() &&
            pod.getStatus()!.getContainerStatusesList().length > 0
          ) {
            const image = pod
              .getStatus()!
              .getContainerStatusesList()[0]
              .getImage()
              .toString();
            const parts = image.trim().split(":");
            if (parts.length === 2) {
              version = parts[1];
            }
          }
          return {
            status,
            error,
            namespace: pod.getMetadata()!.getNamespace(),
            name: pod.getMetadata()!.getName(),
            hostNetwork: pod.getSpec()!.getHostNetwork(),
            hostname: pod.getSpec()!.getNodeName(),
            version: version
          };
        });
    } catch (err) {
      context.logger.error(
        { err, clusterInfo },
        "could not fetch covalent pod status"
      );
      return [];
    }
  } else {
    return [];
  }
}

export async function getCluster(
  context: IContext,
  clusterId: string,
  selectedFields: IClusterSelectedFields
): Promise<Cluster> {
  const { cluster } = await context.configDatabase.getCluster(
    context,
    clusterId,
    selectedFields
  );
  return cluster;
}

export async function getClusters(
  context: IContext,
  selectedFields: IClusterSelectedFields
): Promise<Cluster[]> {
  return context.configDatabase.getClusters(context, selectedFields);
}

function protocolInputToProtocol(
  endpoint: AppEndpoint,
  input: ProtocolInput
): Protocol {
  const functionSources = (input.functions || []).reduce((accum, curr) => {
    curr.allowedSources.forEach(id => {
      accum.add(id);
    });
    return accum;
  }, new Set<string>());
  const protocolSources = input.allowedSources.filter(
    id => !functionSources.has(id)
  );
  const id = input.id || protocolId(endpoint, input);
  let l7Protocol: null | string = null;
  if (input.applicationProtocol) {
    l7Protocol = getL7ProtocolFromApplicationProtocol(
      input.applicationProtocol
    );
  }
  return {
    ...input,
    id,
    l7Protocol,
    allowedSources: protocolSources,
    functions: input.functions as AppFunction[],
    httpRewriteRules: (input.httpRewriteRules || []).map(
      (rule): HttpRewriteRule => {
        return {
          id: rule.id ? rule.id : uuid.v4(),
          method: rule.method,
          path: rule.path
        };
      }
    )
  };
}

export async function getFlow(
  context: IContext,
  args: UserFlowArgs
): Promise<Flow> {
  return context.database.getFlow(context, args);
}

export async function getFlows(
  context: IContext,
  args: UserFlowsArgs
): Promise<FlowConnection> {
  return context.database.getFlows(context, args);
}

export function getClusterSelectedFields(info: any): IClusterSelectedFields {
  return {
    namespaces: graphqlFields(info).namespaces !== undefined,
    unmanagedPods: graphqlFields(info).unmanagedPods !== undefined,
    clusterStatus: graphqlFields(info).status !== undefined,
    cnp: graphqlFields(info).cnp !== undefined,
    cep: graphqlFields(info).cep !== undefined,
    namespaceBaselinePolicyAssignment:
      graphqlFields(info).namespaceBaselinePolicyAssignment !== undefined,
    agentUpgradeInfo: graphqlFields(info).agentUpgradeInfo !== undefined,
    exporterUpgradeInfo: graphqlFields(info).exporterUpgradeInfo !== undefined,
    knp: graphqlFields(info).knp !== undefined
  };
}

export async function getPolicySpecs(
  context: IContext,
  args: UserPolicySpecsArgs
): Promise<PolicySpecs[]> {
  const cluster = await context.configDatabase.getCluster(
    context,
    args.filterBy.clusterId,
    { cnp: true, knp: true }
  );
  return filterSpecs(cluster.cluster.cnp || [], args.filterBy, context);
}

export async function getDashboardCounters(
  context: IContext,
  args: UserDashboardCountersArgs
): Promise<DashboardCounters> {
  const clusterId = args.filterBy.clusterId;
  const { cluster, clusterInfo } = await context.configDatabase.getCluster(
    context,
    clusterId,
    {
      unmanagedPods: true,
      clusterStatus: true
    }
  );
  if (!clusterInfo || clusterInfo.length === 0) {
    throw new Error(`Cluster not found: ${clusterId}`);
  }
  const notCiliumManagedHostNetworkingPods = cluster.unmanagedPods
    ? cluster.unmanagedPods.filter(pod => pod.hostNetwork).length
    : 0;
  const notCiliumManagedPods = cluster.unmanagedPods
    ? cluster.unmanagedPods.length - notCiliumManagedHostNetworkingPods
    : 0;
  return {
    notCiliumManagedPods,
    notCiliumManagedHostNetworkingPods
  };
}
