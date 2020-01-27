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
import gql from "graphql-tag";
import { filter, findIndex, slice } from "lodash";
import * as moment from "moment";
import { Cluster } from "src/graphqlTypes";
import { ClusterStatus, CNP } from "./gqltemplates";
import { State } from "./types";

export const mergeFetchedClusterDataIntoState = (
  data: Cluster,
  state: State
) => {
  const clusterIdx = findIndex(state.clusters, c => c.id === data.id);
  if (clusterIdx >= 0) {
    const dataKeys = filter(Object.keys(data), k => k !== "id");
    const nextClusterData = dataKeys.reduce((acc, key) => {
      return {
        ...acc,
        [key]: data[key]
      };
    }, {});

    return {
      ...state,
      clusters: [
        ...slice(state.clusters, 0, clusterIdx),
        {
          ...state.clusters[clusterIdx],
          ...nextClusterData
        },
        ...slice(state.clusters, clusterIdx + 1)
      ]
    };
  } else {
    return {
      ...state,
      clusters: state.clusters.concat([data])
    };
  }
};

export interface BuildFetchClusterOpts {
  readonly namespaces?: boolean;
  readonly cnp?: boolean;
  readonly policies?: boolean;
  readonly statusInfo?: boolean;
}

const buildFetchClusterOptsDefaults = ({
  namespaces = true,
  cnp = false,
  policies = false,
  statusInfo = false
}: BuildFetchClusterOpts): {
  [P in keyof BuildFetchClusterOpts]-?: BuildFetchClusterOpts[P];
} => ({
  namespaces,
  cnp,
  policies,
  statusInfo
});

export const buildFetchClustersQuery = (args: BuildFetchClusterOpts) => {
  return gql`
  query policy {
    viewer {
      clusters {
        ${buildFetchClusterTemplate(args)}
      }
    }
  }
`;
};

export const buildFetchClusterQuery = (args: BuildFetchClusterOpts) => {
  return gql`
  query getCluster($id: String!) {
    viewer {
      getCluster(id: $id) {
        ${buildFetchClusterTemplate(args)}
      }
    }
  }  
`;
};

export const buildFetchClusterTemplate = (args: BuildFetchClusterOpts) => {
  const opts = buildFetchClusterOptsDefaults(args);
  // prettier-ignore
  return `
    id
    name
    type
    lastSynced
    ${opts.namespaces ? `
      namespaces
    ` : ""}
    ${opts.cnp ? `${CNP}` : ""}
    ${opts.policies ? `
      defaultBaselinePolicyId
      defaultBaselinePolicyVersion
      namespaceBaselinePolicyAssignment {
        namespace
        policyId
        policyVersion
      }
    `: ""}
    ${opts.statusInfo ? `
      ${ClusterStatus}
    ` : ""}
`;
};

export const isClusterLive = ({ lastSynced }: Cluster) => {
  if (lastSynced) {
    return moment().diff(lastSynced, "hours") < 3;
  }
  return false;
};
