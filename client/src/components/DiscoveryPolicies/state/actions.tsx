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
  DiscoveryPoliciesActionTypes,
  DiscoveryPoliciesActions
} from "./types";
import { CiliumNetworkPolicy, PolicySpecs } from "src/graphqlTypes";

export const setLoading = (): DiscoveryPoliciesActions => ({
  type: DiscoveryPoliciesActionTypes.SET_LOADING
});

export const setCNPs = (
  data: CiliumNetworkPolicy[]
): DiscoveryPoliciesActions => ({
  type: DiscoveryPoliciesActionTypes.SET_CNPS,
  payload: data
});

export const setSpecs = (data: PolicySpecs[]): DiscoveryPoliciesActions => ({
  type: DiscoveryPoliciesActionTypes.SET_SPECS,
  payload: data
});

export const setSelected = (
  selected: CiliumNetworkPolicy | PolicySpecs
): DiscoveryPoliciesActions => ({
  type: DiscoveryPoliciesActionTypes.SET_SELECTED,
  payload: selected
});
