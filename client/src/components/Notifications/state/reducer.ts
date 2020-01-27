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
import * as helpers from "../../../state/helpers";
import { State } from "./types";
import {
  flashNotification,
  showNotification,
  hideNotification
} from "./actions";

const initialState: State = {
  notifications: {},
  ids: [],
  visible: false
};

export const reducer = (state = initialState, action: Action): State => {
  switch (action.type) {
    case flashNotification.type: {
      const { payload } = action as typeof flashNotification.actionType;
      const { notification } = payload;
      return {
        ...state,
        notifications: {
          ...state.notifications,
          [notification.id]: notification
        },
        ids: state.ids.concat(notification.id),
        visible: true
      };
    }
    case hideNotification.type: {
      const { payload } = action as typeof hideNotification.actionType;
      const { notificationId } = payload;
      const { ids } = state;
      if (ids[ids.length - 1] !== notificationId) {
        return state;
      }
      return {
        ...state,
        visible: false
      };
    }
    default:
      return state;
  }
};
