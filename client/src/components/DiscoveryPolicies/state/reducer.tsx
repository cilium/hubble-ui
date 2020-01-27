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
  DiscoveryPoliciesState,
  DiscoveryPoliciesActions,
  DiscoveryPoliciesActionTypes
} from "./types";

export const initialState: DiscoveryPoliciesState = {
  loading: false,
  cnps: [],
  specs: [],
  selected: null
};

export const discoveryPoliciesReducer = (
  state: DiscoveryPoliciesState,
  action: DiscoveryPoliciesActions
): DiscoveryPoliciesState => {
  switch (action.type) {
    case DiscoveryPoliciesActionTypes.SET_CNPS: {
      return {
        ...state,
        cnps: action.payload,
        selected: action.payload.length ? action.payload[0] : null,
        loading: false
      };
    }

    case DiscoveryPoliciesActionTypes.SET_SPECS: {
      return {
        ...state,
        specs: action.payload,
        selected: action.payload.length ? action.payload[0] : null,
        loading: false
      };
    }

    case DiscoveryPoliciesActionTypes.SET_LOADING: {
      return {
        ...state,
        loading: !state.loading
      };
    }

    case DiscoveryPoliciesActionTypes.SET_SELECTED: {
      return {
        ...state,
        selected: action.payload
      };
    }

    default:
      return state;
  }
};
