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
import { EndpointTemplate } from "../../App/state/gqltemplates";
import { CNP, UnmanagedPods } from "./gqltemplates";

export const fetchClusterCnps = gql`
  query policy {
    viewer {
      clusters {
        id
        ${CNP}
      }
    }
  }
`;

export const getClusterUnmanagedPods = gql`
  query getCluster($id: String!) {
    viewer {
      getCluster(id: $id) {
        id
        ${UnmanagedPods}
      }
    }
  }  
`;

export const discoverCluster = gql`
  query discoverCluster(
    $clusterId: String!,
    $namespaces: [String!],
    $startedAfter: DateTime!,
    $excludedLabelKeys: [String!]!,
    $nameLabelKeys: [String!]!,
  ) {
    viewer {
      discoverCluster(
        clusterId: $clusterId,
        namespaces: $namespaces,
        startedAfter: $startedAfter,
        excludedLabelKeys: $excludedLabelKeys,
        nameLabelKeys: $nameLabelKeys
      ) {
        endpoints {
          ${EndpointTemplate}
          hasIngressPolicyRules
          hasEgressPolicyRules
        }
        responseHash
        responseTimestamp
      }
    }
  }
`;
