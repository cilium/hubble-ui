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
import { combineReducers } from "redux";
import {
  AUTHENTICATE,
  AUTHENTICATE_SUCCESS,
  AUTHENTICATE_FAILURE,
  AUTHENTICATE_SET_AUTHENTICATED,
  AUTHENTICATE_SET_TOKEN
} from "./actions";
import { StatusState, UserState, State } from "./types";
import { Action } from "../createAction";

const userToken = localStorage.getItem("userToken");
const initialStatusState: StatusState = {
  loading: false,
  authenticated: Boolean(userToken && userToken.length > 0)
};
const status = (state = initialStatusState, action: Action): StatusState => {
  switch (action.type) {
    case AUTHENTICATE_SET_AUTHENTICATED:
      return { loading: false, authenticated: action.payload, error: null };
    case AUTHENTICATE:
      return { loading: true, authenticated: false, error: null };
    case AUTHENTICATE_SUCCESS:
      return { loading: false, authenticated: true, error: null };
    case AUTHENTICATE_FAILURE:
      return {
        loading: false,
        authenticated: false,
        error: (action as any).error
      };
    default:
      return state;
  }
};

const initialUserState: UserState = {};
const user = (
  state = initialUserState,
  action: Action<any, any>
): UserState => {
  return state;
};

const initialTokenState: null | string = null;
const token = (state = initialTokenState, action: Action<any, any>) => {
  switch (action.type) {
    case AUTHENTICATE_SET_TOKEN:
      return action.payload;
    default:
      return state;
  }
};

export const reducer = combineReducers<State>({
  status,
  user,
  token
});
