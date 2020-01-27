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
import { Dispatch, GetState } from "../index";

export const AUTHENTICATE = "auth/authenticate";
export const AUTHENTICATE_SUCCESS = "auth/authenticateSuccess";
export const AUTHENTICATE_FAILURE = "auth/authenticateFailure";
export const AUTHENTICATE_SET_AUTHENTICATED = "auth/setAuthenticated";
export const AUTHENTICATE_SET_TOKEN = "auth/setToken";

type Credentials = {
  email: string;
  password: string;
};

export const setLogin = () => ({
  type: AUTHENTICATE_SET_AUTHENTICATED,
  payload: true
});

export const setLogout = () => ({
  type: AUTHENTICATE_SET_AUTHENTICATED,
  payload: false
});

export const setToken = (token: string) => ({
  type: AUTHENTICATE_SET_TOKEN,
  payload: token
});

export const authenticate = (credentials: Credentials) => (
  dispatch: Dispatch,
  getState: GetState
) => {
  dispatch({
    type: AUTHENTICATE,
    payload: credentials
  });
  if (credentials.email === "bro@covalent.io") {
    setTimeout(() => {
      authenticateSuccess()(dispatch);
    }, 1000);
  } else {
    setTimeout(() => {
      authenticateFailure("Invalid email or password")(dispatch);
    }, 1000);
  }
};

export const authenticateSuccess = () => (dispatch: Dispatch) =>
  dispatch({
    type: AUTHENTICATE_SUCCESS
  });

export const authenticateFailure = (error: string) => (dispatch: Dispatch) =>
  dispatch({
    type: AUTHENTICATE_FAILURE,
    error
  });
