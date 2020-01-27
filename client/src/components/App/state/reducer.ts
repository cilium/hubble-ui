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
import {
  getPanelPosition,
  LOCAL_STORAGE_POSITION_KEY
} from "../../DraggableView/DraggableView";
import { setMapPanelPosition } from "../../DraggableView/state/actions";
import { setNextDiscoveryTime, updateScreenDimensions } from "./actions";
import { State } from "./types";

const initMinsAgo = (key: string, defaultAgo: number = 5) => {
  // let minsAgo: number | string | null = localStorage.getItem(key);
  let minsAgo;
  if (!minsAgo) {
    minsAgo = defaultAgo;
  } else {
    minsAgo = Number.parseInt(minsAgo);
  }
  return minsAgo;
};

const discoveryMinsAgo = initMinsAgo("discoveryMinsAgo");

const initialState: State = {
  mapPanelPosition: getPanelPosition(),
  screen: {
    dimensions: {
      width: 0,
      height: 0
    }
  },
  discoveryMinsAgo: discoveryMinsAgo,
  nextDiscoveryTime: null
};

export const reducer = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case setMapPanelPosition.type: {
      const { args } = action as typeof setMapPanelPosition.actionType;
      localStorage.setItem(LOCAL_STORAGE_POSITION_KEY, String(args.position));
      return {
        ...state,
        mapPanelPosition: args.position
      };
    }
    case updateScreenDimensions.type: {
      const { args } = action as typeof updateScreenDimensions.actionType;
      return {
        ...state,
        screen: {
          ...state.screen,
          dimensions: {
            ...state.screen.dimensions,
            ...args
          }
        }
      };
    }
    case setNextDiscoveryTime.type: {
      const { payload } = action as typeof setNextDiscoveryTime.actionType;
      return {
        ...state,
        nextDiscoveryTime: payload.date
      };
    }
    default: {
      return state;
    }
  }
};
