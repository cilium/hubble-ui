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
  AppFunction,
  Flow,
  FlowConnection,
  FlowDnsResponse,
  FlowHttpResponse,
  FlowMetricsResponse,
  Label,
  Protocol
} from "../../../graphqlTypes";
import { COLUMN_SYMBOL } from "../columns/types";

export interface State {
  readonly connection: FlowConnection | null;
  readonly autoRefesh: boolean;
  readonly loading: "no" | "replace" | "prepend" | "append";
  readonly loadingChart: boolean;
  readonly columnsVisibility: { [key in COLUMN_SYMBOL]: boolean };
  readonly flowsToPolicy: { [key: string]: Flow };
  readonly flowsTableMode: "view" | "edit";
}

export interface ExtFlow {
  ref: Flow;
  included?: boolean;
  sourceElement: {
    endpoint: {
      title: string;
      subtitle: string | null;
      labels: Label[];
    };
  };
  destinationElement: {
    endpoint: {
      title: string;
      subtitle: string | null;
      labels: Label[];
      ipAddress?: string | null;
      dnsName?: string | null;
    };
    protocol?: {
      id: string;
      port?: number | null;
      l34Protocol?: string | null;
      l7Protocol?: string | null;
    };
    function?: {
      id: string;
      name?: string | null | undefined;
      dnsResponse?: FlowDnsResponse | null | undefined;
      httpResponse?: FlowHttpResponse | null | undefined;
      metricsResponse?: FlowMetricsResponse | null | undefined;
    } | null;
  };
}

export interface DiscoveryFlow extends ExtFlow {
  sourceEndpoint: AppEndpoint;
  destinationEndpoint: AppEndpoint;
  destinationProtocol?: Protocol | null;
  destinationFunction?: AppFunction | null;
}

export interface EnhancedFlow<FlowType extends Flow> {
  readonly id: string;
  readonly appName: string;
  readonly clusterName: string;
  readonly isTroubleshootingFlow: boolean;
  readonly type: "l7" | "l34";
  readonly flow: FlowType;
  readonly sourceEndpointName?: string | null;
  readonly destinationEndpointName?: string | null;
  readonly destinationFunctionName?: string | null;
  readonly sourceEndpoint: AppEndpoint | null;
  readonly sourceStatus: "included" | "excluded";
  readonly destinationEndpoint: AppEndpoint | null;
  readonly destinationProtocol: Protocol | null;
  readonly destinationFunction: AppFunction | null;
  readonly includable: boolean;
  readonly filter: {
    readonly source: string;
    readonly destination: string;
  };
}

export type AnyEnhancedFlow = EnhancedFlow<Flow>;
