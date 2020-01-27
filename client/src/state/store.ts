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
import { connectRouter, routerMiddleware } from "connected-react-router";
import { createBrowserHistory } from "history";
import {
  applyMiddleware,
  combineReducers,
  compose,
  createStore as createReduxStore
} from "redux";
import { createLogger } from "redux-logger";
import thunkMiddleware from "redux-thunk";
import { createAsyncAction } from ".";
import { withModal } from "../components/Modal/withModal";
import { flushError, flushOk } from "../components/Notifications/state/actions";
import client, { IGraphQLClient } from "../graphql/client";
import { reducers, RootState } from "./rootReducer";

export const createStore = (gqlClient: IGraphQLClient) => {
  const history = createBrowserHistory();
  const middlewares = [
    thunkMiddleware.withExtraArgument(gqlClient),
    routerMiddleware(history)
  ];
  if (process.env.NODE_ENV === "development") {
    // order matters, logger should go last
    middlewares.push(
      createLogger({
        collapsed: true,
        titleFormatter: (action, time) => {
          let appendix = "";
          if (action.meta && action.meta.stack) {
            const { stack } = action.meta;
            const splitedStack = stack.split("\n").slice(4);
            const at = splitedStack[0];
            if (at) {
              const caller = splitedStack
                ? splitedStack[0].trim().replace("at ", "")
                : null;
              appendix = caller;
            }
          }
          let title = `${action.type} (${time}`;
          if (appendix) {
            title += appendix ? ` in ${appendix}` : "";
          }
          return title + ")";
        }
      })
    );
  }
  const rootReducer: {
    (state: RootState, action: any): RootState;
  } = combineReducers<RootState>({
    ...reducers,
    router: connectRouter(history)
  });

  const store = createReduxStore(
    rootReducer,
    compose(applyMiddleware(...middlewares))
  );

  return { store, history };
};

export const { store, history } = createStore(client);

client.setStore(store);
withModal.setStore(store);
createAsyncAction.setNotificationMethods({ flushError, flushOk });

store.dispatch({
  type: "Identify"
});
