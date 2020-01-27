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

const FlowTemplate = `
  id
  hash
  sourcePodName
  sourceDeploymentId
  sourceLabels {
    key
    value
  }
  sourceIpAddress
  sourceSecurityId
  destinationPodName
  destinationDeploymentId
  destinationLabels {
    key
    value
  }
  destinationIpAddress
  destinationSecurityId
  destinationDnsName
  destinationL4Protocol
  destinationL7Protocol
  destinationPort
  destinationFunctionName
  tcpControlBits
  timestamp
  forwardingStatus
  forwardingStatusDetails
  direction
  requestOrResponse
  ciliumEventSubType
  dnsResponse {
    query
    rcode
    ips
  }
  httpResponse {
    code
    method
    protocol
    url
    headers {
      key
      value
    }
  }
  metricsResponse {
    latencyMs
  }
`;

export const getFlows = gql`
  query getFlows(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $filterBy: FlowFiltersInput
    $nextgenstore: Boolean,
    $groupSourceByNamespace: Boolean,
    $groupDestinationByNamespace: Boolean,
    $groupDestinationByDnsName: Boolean,
    $unaggregated: Boolean
  ) {
    viewer {
      flows(
        first: $first
        after: $after
        last: $last
        before: $before
        filterBy: $filterBy
        nextgenstore: $nextgenstore,
        groupSourceByNamespace: $groupSourceByNamespace,
        groupDestinationByNamespace: $groupDestinationByNamespace,
        groupDestinationByDnsName: $groupDestinationByDnsName,
        unaggregated: $unaggregated
      ) {
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        edges {
          cursor
          node {
            ${FlowTemplate}
          }
        }
      }
    }
  }
`;

export const getFlow = gql`
  query getFlow($id: String!, $nextgenstore: Boolean, $labels: [LabelInput!]) {
    viewer {
      flow(id: $id, nextgenstore: $nextgenstore, labels: $labels) {
        ${FlowTemplate}
      }
    }
  }
`;
