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
import { Action } from "./createAction";

/**
 * Helper functions to work with state
 */
const INITIAL_STATUS_STATE = {
  initialLoad: true,
  loading: true,
  error: null
};

export interface IStatusState {
  initialLoad: boolean;
  loading: boolean;
  error: string;
}

interface IStatusActions {
  start: string;
  success: string;
  failure: string;
}

/**
 * Creates status reducer function
 * Reducer status manages state for async operations, which usually
 * consist from 3 actions: start, success, failure
 *
 * on start we set loading: true and reset previous error
 * on success, set loading to false (error should already be null, so no change)
 * on failure, set loading to false and set error
 */
export const createStatusReducer = ({
  start,
  success,
  failure
}: IStatusActions) => (
  state = INITIAL_STATUS_STATE,
  action: Action<any, any>
) => {
  switch (action.type) {
    case start:
      return {
        ...state,
        loading: true,
        error: null
      };
    case success:
      return {
        ...state,
        initialLoad: false,
        loading: false
      };
    case failure:
      return {
        ...state,
        initialLoad: false,
        loading: false,
        error: (action as any).error
      };
    default:
      return state;
  }
};

export interface IMap<V> {
  [key: string]: V;
}

export const filter = <V>(map: IMap<V>, filter: (x: V) => boolean): IMap<V> => {
  return Object.keys(map).reduce((acc, key) => {
    const item = map[key];
    if (filter(item)) {
      acc[key] = item;
    }
    return acc;
  }, {});
};

export const update = <V>(
  map: IMap<V>,
  updater: any | ((x: V) => any)
): IMap<V> => {
  return Object.keys(map).reduce((acc, ruleId) => {
    acc[ruleId] = updateItemByKey(map, ruleId, updater);
    return acc;
  }, {});
};

export const updateByKey = <V>(
  map: IMap<V>,
  key: string,
  updater: any | ((x: V) => any)
): IMap<V> => {
  return {
    ...map,
    [key]: updateItemByKey(map, key, updater)
  };
};

export const updateItem = <V>(item: V, data: any): V => {
  return {
    ...(item as IMap<any>),
    ...data
  };
};

export const updateItemByKey = <V>(
  map: IMap<V>,
  key: string,
  updater: any | ((x: V) => any)
): V => {
  const item = map[key];
  const data = updater instanceof Function ? updater(item) : updater;
  return updateItem(item, data);
};
