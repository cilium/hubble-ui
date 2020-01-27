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
import * as moment from "moment";
import { IClusterInfo, IConfigDatabase } from "./configDb";
import { CiliumNetworkPolicy, Cluster, ClusterType } from "./graphqlTypes";
import * as k8s from "./server/k8s";
import { IClusterSelectedFields, IContext } from "./types";

export class ConfigDatabaseHubble implements IConfigDatabase {
  constructor(private readonly client) {}
  async initialize(): Promise<void> {}

  // Returns a cluster for a given organization by id
  async getCluster(
    context: IContext,
    cluster: string,
    selectedFields?: IClusterSelectedFields,
    namespace?: string
  ): Promise<{ cluster: Cluster; clusterInfo: IClusterInfo[] }> {
    const clusterInfo = await this.getClusterInfo(
      context,
      cluster,
      undefined,
      undefined,
      undefined,
      namespace
    );
    const cnp =
      selectedFields && selectedFields.cnp
        ? await k8s.getCiliumNetworkPolicies(context.user.token)
        : undefined;
    const knp =
      selectedFields && selectedFields.knp
        ? await k8s.getKubernetesNetworkPolicies(context.user.token)
        : undefined;
    return {
      clusterInfo,
      cluster: {
        __typename: "Cluster",
        id: "default",
        name: "default",
        type: ClusterType.KUBERNETES,
        namespaces: clusterInfo[0].namespaces,
        lastSynced: clusterInfo[0].date,
        cnp:
          cnp || knp
            ? ([...(cnp || []), ...(knp || [])] as CiliumNetworkPolicy[])
            : undefined
      }
    };
  }

  // Returns a list of clusters for a given organization.
  async getClusters(
    context: IContext,
    selectedFields: IClusterSelectedFields,
    namespace?: string
  ): Promise<Cluster[]> {
    return this.getCluster(
      context,
      "default",
      selectedFields,
      namespace
    ).then(({ cluster }) => [cluster]);
  }

  // Returns a list of ClusterInfos in a given time range.
  async getClusterInfo(
    context: IContext,
    cluster: string,
    start?: moment.Moment,
    end?: moment.Moment,
    numRecords?: number,
    namespace?: string
  ): Promise<IClusterInfo[]> {
    const namespaces = await k8s.getNamespacesList();
    if (!namespace) {
      return [
        {
          cep: [],
          endpoints: "[]",
          namespaces: namespaces,
          services: '{"metadata":{},"items":[]}',
          k8sEndpoints: '{"metadata":{},"items":[]}',
          date: new Date().toISOString(),
          podList: { getPodsList: () => [] } as any
        }
      ];
    }
    const podList = await k8s.getPodListForNamespace(
      context.user.token,
      namespace
    );
    const cep = await k8s.getCiliumEndpointsForNamespace(
      context.user.token,
      namespace
    );
    const clusterInfo: IClusterInfo = {
      cep: cep,
      endpoints: JSON.stringify(
        cep.map(endpoint => ({
          id: endpoint.identityId,
          labels: endpoint.identityLabels.map(
            ({ key, value }) => `${key}=${value}`
          )
        }))
      ),
      namespaces: namespaces,
      services: JSON.stringify(
        await k8s.getServicesForNamespace(context.user.token, namespace)
      ),
      k8sEndpoints: JSON.stringify(
        await k8s.getK8SEndpointsForNamespace(context.user.token, namespace)
      ),
      date: new Date().toISOString(),
      podList: {
        getPodsList: () => podList
      } as any
    };
    return [clusterInfo];
  }
}
