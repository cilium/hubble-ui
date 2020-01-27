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
import { Moment } from "moment";
import {
  AppEndpoint,
  AppFunction,
  Cluster,
  Protocol
} from "../../../graphqlTypes";

export type AllowedSourcesDisabledMap = { [key: string]: string[] };

type Optional<T> = { [P in keyof T]?: T[P] };

export const AppEndpointsChangesMetaProps = {
  disabled: true,
  icon: true,
  name: true,
  labels: true,
  v4Cidrs: true,
  v6Cidrs: true,
  dnsName: true
};

export type AppEndpointsChangesMeta = Optional<
  Pick<AppEndpoint, keyof typeof AppEndpointsChangesMetaProps>
>;

export const ProtocolsChangesMetaProps = {
  applicationProtocol: true,
  allowedSources: true
};

export type ProtocolsChangesMeta = Optional<
  Pick<Protocol, keyof typeof ProtocolsChangesMetaProps>
>;

export const FunctionsChangesMetaProps = {
  name: true,
  disabled: true,
  allowedSources: true
};

export type FunctionsChangesMeta = Optional<
  Pick<AppFunction, keyof typeof FunctionsChangesMetaProps>
>;

export type ChangesMetaPayload =
  | AppEndpointsChangesMeta
  | ProtocolsChangesMeta
  | FunctionsChangesMeta
  | "new"
  | "removed";

export type ChangesMeta = {
  readonly id: string;
  readonly payload: ChangesMetaPayload;
};

export type ChangesMetaMap = {
  [key: string]: ChangesMetaPayload;
};

export interface State {
  readonly mapPanelPosition: number;
  readonly screen: {
    readonly dimensions: {
      readonly width: number;
      readonly height: number;
    };
  };
  readonly discoveryMinsAgo: number;
  readonly nextDiscoveryTime: Moment | null;
}

export interface ClusterModeInfo {
  readonly disabled: boolean;
  readonly cluster: Cluster;
  readonly enforced: boolean;
  readonly namespaces: string[];
  readonly appId: string;
  readonly appVersion: string;
}

export enum AppEndpointIconType {
  PROTOCOL = "logo",
  EMOJI = "emoji"
}

export type GqlResult<T> = { viewer: T };
