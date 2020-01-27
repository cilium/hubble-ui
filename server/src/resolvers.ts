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
import {
  Cluster,
  ClusterCepArgs,
  ClusterCnpArgs,
  DashboardCounters,
  DiscoverClusterResult,
  Flow,
  FlowConnection,
  PolicySpecs,
  UserDashboardCountersArgs,
  UserDiscoverClusterArgs,
  UserFlowArgs,
  UserFlowsArgs,
  UserGetClusterArgs,
  UserPolicySpecsArgs
} from "./graphqlTypes";
import {
  discoverCluster,
  getCluster,
  getClusters,
  getClusterSelectedFields,
  getDashboardCounters,
  getFlow,
  getFlows,
  getPolicySpecs
} from "./resolversImpl";
import { DateTimeType, IContext, User } from "./types";

// http://dev.apollodata.com/tools/graphql-tools/resolvers.html
export const resolvers = {
  DateTime: DateTimeType,
  Query: {
    viewer(obj, args, context: IContext): User {
      return context.user;
    }
  },

  Cluster: {
    cnp(obj, args: ClusterCnpArgs, context: IContext, info) {
      return args.namespace
        ? (obj.cnp || []).filter(policy => policy.namespace === args.namespace)
        : obj.cnp;
    },
    cep(obj, args: ClusterCepArgs, context: IContext, info) {
      return args.namespace
        ? (obj.cep || []).filter(cep => cep.namespace === args.namespace)
        : obj.cep;
    }
  },

  User: {
    discoverCluster(
      obj,
      args: UserDiscoverClusterArgs,
      context: IContext
    ): Promise<DiscoverClusterResult> {
      return discoverCluster(
        args.clusterId,
        args.namespaces,
        args.startedAfter,
        args.excludedLabelKeys,
        args.nameLabelKeys,
        args.filterBy,
        context
      );
    },

    clusters(obj, args, context: IContext, info): Promise<Cluster[]> {
      const selectedFields = getClusterSelectedFields(info);
      return getClusters(context, selectedFields);
    },

    getCluster(
      obj,
      args: UserGetClusterArgs,
      context: IContext,
      info
    ): Promise<Cluster> {
      const selectedFields = getClusterSelectedFields(info);
      return getCluster(context, args.id, selectedFields);
    },

    flow(obj, args: UserFlowArgs, context: IContext): Promise<Flow> {
      return getFlow(context, args);
    },

    flows(
      obj,
      args: UserFlowsArgs,
      context: IContext
    ): Promise<FlowConnection> {
      return getFlows(context, args);
    },

    policySpecs(
      obj,
      args: UserPolicySpecsArgs,
      context: IContext
    ): Promise<PolicySpecs[]> {
      return getPolicySpecs(context, args);
    },

    dashboardCounters(
      obj,
      args: UserDashboardCountersArgs,
      context: IContext
    ): Promise<DashboardCounters> {
      return getDashboardCounters(context, args);
    }
  }
};
