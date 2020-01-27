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
import createCachedSelector from "re-reselect";
import { connect } from "react-redux";
import { bindActionCreators, combineReducers, compose } from "redux";
import { createSelector } from "reselect";
import client from "../graphql/client";
import { createAction } from "./createAction";
import { createAsyncAction } from "./createAsyncAction";
import { createReducer } from "./createReducer";
import { provide, provideWithRouter } from "./createReduxHelpers";

export { Dispatch, GetState, ReactComponent } from "./commonTypes";

export {
  bindActionCreators,
  connect,
  compose,
  combineReducers,
  createAction,
  createAsyncAction,
  provide,
  provideWithRouter,
  client,
  createReducer,
  createSelector,
  createCachedSelector
};
