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
import { AppEndpoint, AppFunction } from "../../../graphqlTypes";

export interface State extends MapFilters {}

export interface MapFilters {
  readonly showIngressTraffic: boolean;
  readonly showEgressTraffic: boolean;
  readonly showKubeDns: boolean;
  readonly showIntraAppTraffic: boolean;
  readonly showL7Traffic: boolean;
  readonly aggregateIngressFlows: boolean;
  readonly aggregateEgressFlows: boolean;
  // New filters
  readonly showHostEndpoint: boolean;
  readonly showWorldEndpoint: boolean;
}

export interface Coord {
  readonly x: number;
  readonly y: number;
}

export interface Coords {
  [key: string]: Coord;
}

export type Connection = {
  filtered?: boolean;
  from?: boolean;
  to?: boolean;
  outside?: boolean;
  type?: "many-egress-from-app" | "many-ingress-to-app";
};

export type Connections = {
  [key: string]: Connection;
};

export interface ConnectionsMap {
  filterByEndpoint: string | null;
  connections: Connections;
}

export interface Node {
  readonly endpoint: AppEndpoint;
  readonly isFlowsFiltered: boolean;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly weight?: number;
  readonly connection: Connection;
  readonly connectors: Coords;
  readonly functionsCoords: Coords;
  readonly protocolsCoords: Coords;
  readonly moreLabelsCoords: Coords;
  readonly groupsCoords: Coords;
  readonly visibleMode: "visible" | "hidden" | "fogged";
  readonly protocolsFunctionsGroups: ProtocolGroup[];
}

export type ProtocolGroup = {
  readonly protocolIndex: number;
  readonly visibleAllowedSources: string[];
  readonly functionsGroups: FunctionsGroups;
  readonly visibleFunctionsGroups: FunctionsGroups;
  readonly filteredFunctions: AppFunction[];
};

export type FunctionGroup = {
  readonly filtered: boolean;
  readonly visibleAllowedSources: string[];
  readonly functionIndex: number;
  readonly functionTitle: string;
};
export interface FunctionsGroup {
  readonly groupTitle: string;
  readonly functions: FunctionGroup[];
}
export type FunctionsGroups = FunctionsGroup[];

export interface Graph {
  [key: string]: Node;
}

export interface BoundaryCoords {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Boundary {
  readonly type: "app" | "namespace";
  readonly title: string;
}

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export interface BoundaryWithCoords extends Boundary {
  readonly coords: Writeable<BoundaryCoords>;
}

export interface GraphMeta {
  readonly graphWidth: number;
  readonly graphHeight: number;
  readonly boundaries: BoundaryWithCoords[];
}

export type Levels = string[][];

export interface LevelsHeights {
  [key: string]: number;
}
