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
  AppEndpoint,
  Cluster,
  DiscoverClusterResult
} from "../../../graphqlTypes";
import { createAsyncAction, Dispatch } from "../../../state";
import { GqlResult } from "../../App/state/types";
import { pushAppUrl } from "../../Routing/state/actions";
import * as queries from "./queries";
import {
  BuildFetchClusterOpts,
  buildFetchClusterQuery,
  buildFetchClustersQuery
} from "./utils";

export const toggleDiscoveryClusterNamespace = (namespace: string) => (
  dispatch: Dispatch
) => {
  dispatch(
    pushAppUrl({
      namespaces: namespace,
      endpointsQuery: null,
      functionsQuery: null,
      protocolsQuery: null,
      flowsQuery: null
    })
  );
};

export const fetchClusters = createAsyncAction({
  name: "Fetch clusters",
  takeLatest: true,
  action: async (args: BuildFetchClusterOpts, { client }) => {
    const query = {
      query: buildFetchClustersQuery(args)
    };
    const { data } = await client.query<GqlResult<{ clusters: Cluster[] }>>(
      query
    );
    return data.viewer.clusters;
  },
  flushErrorMessage: () => "Failed to fetch clusters"
});

export const fetchClusterCnps = createAsyncAction({
  name: "Fetch cluster's CNPs",
  action: async (args, { client }) => {
    const query = {
      query: queries.fetchClusterCnps
    };
    const { data } = await client.query<GqlResult<{ clusters: Cluster[] }>>(
      query
    );
    return data.viewer.clusters;
  },
  flushErrorMessage: () => "Failed to fetch cluster's CNPs"
});

interface GetClusterUnmanamgedPodsArgs {
  readonly id: string;
}

export const getClusterUnmanagedPods = createAsyncAction({
  name: "Get cluster's unmanaged pods",
  action: async (args: GetClusterUnmanamgedPodsArgs, { client }) => {
    const query = {
      query: queries.getClusterUnmanagedPods,
      variables: { id: args.id }
    };
    const { data } = await client.query<GqlResult<{ getCluster: Cluster }>>(
      query
    );
    return data.viewer.getCluster;
  },
  flushErrorMessage: () => "Failed to fetch cluster's unmanaged pods"
});

interface FetchClusterArgs extends BuildFetchClusterOpts {
  readonly clusterId: string;
}
export const fetchCluster = createAsyncAction({
  name: "Fetch cluster",
  action: async (args: FetchClusterArgs, { client }) => {
    const query = {
      query: buildFetchClusterQuery(args),
      variables: { id: args.clusterId }
    };
    const { data } = await client.query<GqlResult<{ getCluster: Cluster }>>(
      query
    );
    return data.viewer.getCluster;
  },
  flushErrorMessage: () => "Failed to fetch cluster"
});

interface DiscoverClusterArgs {
  readonly clusterId: string;
  readonly namespaces: string[] | undefined | null;
  readonly startedAfter: string;
  readonly excludedLabelKeys: string[];
  readonly nameLabelKeys: string[];
}

export const discoverCluster = createAsyncAction({
  name: "Discover cluster",
  action: async (
    args: DiscoverClusterArgs,
    { client }
  ): Promise<DiscoverClusterResult> => {
    // if (process.env.NODE_ENV === "development") {
    //   return require("./datasets/1.json").data.viewer.discoverCluster;
    // }
    const query = {
      query: queries.discoverCluster,
      variables: args
    };
    const { data } = await client.query<
      GqlResult<{
        discoverCluster: { endpoints: AppEndpoint[]; responseHash: string };
      }>
    >(query);
    return data.viewer.discoverCluster;
  },
  flushErrorMessage: () => "Failed to discover cluster"
});
