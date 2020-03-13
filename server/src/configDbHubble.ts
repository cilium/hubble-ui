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
    const startClusterInfo = Date.now();
    context.logger.debug("Fetching cluster info...");
    const clusterInfo = await this.getClusterInfo(
      context,
      cluster,
      undefined,
      undefined,
      undefined,
      namespace
    );
    context.logger.debug(
      `Fetched cluster info in ${Date.now() - startClusterInfo}ms`
    );

    const startCnp = Date.now();
    context.logger.debug("Fetching cnp...");
    const cnp =
      selectedFields && selectedFields.cnp
        ? await k8s.getCiliumNetworkPolicies()
        : undefined;
    context.logger.debug(`Fetched cnp in ${Date.now() - startCnp}ms`);

    const startKnp = Date.now();
    context.logger.debug("Fetching knp...");
    const knp =
      selectedFields && selectedFields.knp
        ? await k8s.getKubernetesNetworkPolicies()
        : undefined;
    context.logger.debug(`Fetched knp in ${Date.now() - startKnp}ms`);

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
    const startNamespaces = Date.now();
    context.logger.debug("Fetching namespaces...");
    const namespaces = await k8s.getNamespacesList();
    context.logger.debug(
      `Fetched namespaces in ${Date.now() - startNamespaces}ms`
    );
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

    const startPodList = Date.now();
    context.logger.debug("Fetching pods...");
    const podList = await k8s.getPodListForNamespace(namespace);
    context.logger.debug(`Fetched pods in ${Date.now() - startPodList}ms`);

    const startCep = Date.now();
    context.logger.debug("Fetching cep...");
    const cep = await k8s.getCiliumEndpointsForNamespace(namespace);
    context.logger.debug(`Fetched cep in ${Date.now() - startCep}ms`);

    const startServices = Date.now();
    context.logger.debug("Fetching services...");
    const services = JSON.stringify(
      await k8s.getServicesForNamespace(namespace)
    );
    context.logger.debug(`Fetched services in ${Date.now() - startServices}ms`);

    const startKep = Date.now();
    context.logger.debug("Fetching kep...");
    const kep = JSON.stringify(
      await k8s.getK8SEndpointsForNamespace(namespace)
    );
    context.logger.debug(`Fetched kep in ${Date.now() - startKep}ms`);

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
      services: services,
      k8sEndpoints: kep,
      date: new Date().toISOString(),
      podList: {
        getPodsList: () => podList
      } as any
    };
    return [clusterInfo];
  }
}
