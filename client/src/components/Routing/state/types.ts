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
export interface UrlState {
  readonly appAdvancedViewType?: AppAdvancedViewType | null;
  readonly endpointsQuery?: string | null;
  readonly protocolsQuery?: string | null;
  readonly functionsQuery?: string | null;
  readonly flowsQuery?: string | null;
  readonly flowsForwardingStatus?: string | null;
  readonly flowsFilterInput?: string | null;
  readonly flowsStartDate?: TimeFilterValue | null;
  readonly flowsEndDate?: TimeFilterValue | null;
  readonly flowsGroupBySourceNamespace?: "yes" | "no";
  readonly flowsFilterType?: "all" | "external" | "cross-namespace";
  readonly flowsEventsChart?: VisibilityFilter;
  readonly flowsRejectedReasons?: string | null;
  readonly flowsHttpStatusCode?: string | null;
  readonly clusterId?: string | null;
  readonly namespaces?: string | null;
  readonly flowsGroupBy?: string[] | null;
}

export interface UrlStateMeta {
  needRecenterMap: boolean;
}

export enum AppAdvancedViewType {
  SERVICES = "services",
  FLOWS = "flows",
  DIFF = "diff",
  POLICIES = "policies"
}

export interface TimeFilterValue {
  label: string;
  url: string;
}

export type VisibilityFilter = "show" | "hide" | undefined;
