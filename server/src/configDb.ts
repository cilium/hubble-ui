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
import moment = require("moment");
import { K8sPods } from "./collector_service_pb";
import { CiliumEndpoint, Cluster } from "./graphqlTypes";
import { IClusterSelectedFields, IContext } from "./types";

export interface IClusterInfo {
  readonly namespaces: string[];
  readonly endpoints: string;
  readonly services: string;
  readonly k8sEndpoints: string;
  readonly date: string;
  readonly podList: K8sPods;
  readonly cep: CiliumEndpoint[];
}

export interface IConfigDatabase {
  initialize(): Promise<void>;
  // Returns a cluster for a given organization by id
  getCluster(
    context: IContext,
    cluster: string,
    selectedFields?: IClusterSelectedFields,
    namespace?: string
  ): Promise<{ cluster: Cluster; clusterInfo: IClusterInfo[] }>;

  // Returns a list of clusters for a given organization.
  getClusters(
    context: IContext,
    selectedFields: IClusterSelectedFields,
    namespace?: string
  ): Promise<Cluster[]>;

  // Returns a list of ClusterInfos in a given time range.
  getClusterInfo(
    context: IContext,
    cluster: string,
    start?: moment.Moment,
    end?: moment.Moment,
    numRecords?: number,
    namespace?: string
  ): Promise<IClusterInfo[]>;
}
