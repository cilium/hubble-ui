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
import { Action } from "src/state/createAction";
import { toggleTrafficFilter } from "../../App/state/actions";
import { MapFilters, State } from "./types";

const initialState: State = {
  showIngressTraffic: readLocalStorage("showIngressTraffic", true),
  showEgressTraffic: readLocalStorage("showEgressTraffic", true),
  showIntraAppTraffic: readLocalStorage("showIntraAppTraffic", true),
  showL7Traffic: readLocalStorage("showL7Traffic", true),
  aggregateIngressFlows: readLocalStorage("aggregateIngressFlows", false),
  aggregateEgressFlows: readLocalStorage("aggregateEgressFlows", false),
  showHostEndpoint: readLocalStorage("showHostEndpoint", false),
  showWorldEndpoint: readLocalStorage("showWorldEndpoint", false)
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case toggleTrafficFilter.type: {
      const { payload } = action as typeof toggleTrafficFilter.actionType;
      writeLocalStorage(payload.filter, !state[payload.filter]);
      return {
        ...state,
        [payload.filter]: !state[payload.filter]
      };
    }
    default: {
      return state;
    }
  }
};

function localStorageKey(key: string) {
  const map: { [key in keyof MapFilters]: string } = {
    showIngressTraffic: "showIngressTraffic",
    showEgressTraffic: "showEgressTraffic",
    showIntraAppTraffic: "showIntraAppTraffic",
    showL7Traffic: "showL7Traffic",
    aggregateIngressFlows: "v2-aggregateIngressFlows",
    aggregateEgressFlows: "v2-aggregateEgressFlows",
    showHostEndpoint: "showHostEndpoint",
    showWorldEndpoint: "showWorldEndpoint"
  };
  return map[key];
}

function readLocalStorage(key: string, def: any) {
  const item = `map-${localStorageKey(key)}`;
  switch (localStorage.getItem(item)) {
    case "on":
      return true;
    case "off":
      return false;
    default:
      return def;
  }
}

async function writeLocalStorage(key: string, value: boolean) {
  const item = `map-${localStorageKey(key)}`;
  localStorage.setItem(item, value ? "on" : "off");
}
