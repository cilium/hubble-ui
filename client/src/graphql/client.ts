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
import { DocumentNode, GraphQLError } from "graphql";
import * as moment from "moment";
import { Store } from "redux";
import { logout, showLoginDialog } from "../auth";
import { setLogout } from "../state/auth/actions";

const API_ENDPOINT = "/graphql";

export interface GraphQLResponse<ResultType> {
  readonly data: ResultType;
  readonly errors: GraphQLError[];
}

export interface IGraphQLClient {
  setStore: (store: Store) => void;
  query<ResultType>(
    options: QueryOptions
  ): Promise<GraphQLResponse<ResultType>>;
  mutate<ResultType>(
    options: MutationOptions
  ): Promise<GraphQLResponse<ResultType>>;
}

interface MutationOptions {
  readonly mutation?: DocumentNode;
  readonly variables?: {
    [key: string]: any;
  };
}

interface QueryOptions {
  readonly query?: DocumentNode;
  readonly variables?: {
    [key: string]: any;
  };
}

const logoutHubble = () => {
  if (localStorage.getItem("HUBBLE_AUTH_TOKEN")) {
    localStorage.removeItem("HUBBLE_AUTH_TOKEN");
    window.location.replace("/");
  } else {
    throw new Error("Unauthorized");
  }
};

const logoutMiddleware = (store: Store | null, response: Response) => {
  if (response.status === 401) {
    if (store) {
      store.dispatch(setLogout());
    }
    logout();
    showLoginDialog();
    throw new Error("Unauthorized");
  }
};

const statusCodeMiddleware = (response: Response) => {
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`http_status_code=${response.status}`);
  }
};

const dataMiddleware = (response: Response, json: GraphQLResponse<any>) => {
  if (json.errors) {
    if (json.errors.find(error => error.message === "Unauthorized")) {
      logoutHubble();
    } else {
      throw new Error(json.errors.map(error => error.message).join(". "));
    }
  } else if (!json.data) {
    throw new Error("No data");
  }
};

const graphqlFetch = (options: QueryOptions) => {
  const body: { query?: string; mutation?: string; variables: any } = {
    variables: options.variables
  };
  const headers = {
    "content-type": "application/json"
  };

  if ((options as QueryOptions).query && (options as QueryOptions).query!.loc) {
    body.query = (options as QueryOptions).query!.loc!.source.body;
  }
  return fetch(API_ENDPOINT, {
    method: "POST",
    mode: "same-origin",
    credentials: "same-origin",
    cache: "no-cache",
    headers,
    body: JSON.stringify(body)
  });
};

const query = async (store: Store | null, options: QueryOptions) => {
  const start = moment();
  const handleError = (error: Error, response: Response | null) => {
    return {
      level: "critical",
      error
    };
  };

  let response: Response | null = null;
  try {
    response = await graphqlFetch(options);
  } catch (error) {
    throw handleError(error, response);
  }
  if (response) {
    try {
      logoutMiddleware(store, response);
      statusCodeMiddleware(response);
      const json: GraphQLResponse<any> = await response.json();
      dataMiddleware(response, json);
      return json;
    } catch (error) {
      throw handleError(error, response);
    }
  } else {
    throw handleError(new Error("No response"), response);
  }
};

export const createClient = (): IGraphQLClient => {
  let store: null | Store = null;
  return {
    setStore: s => (store = s),
    query: async (options: QueryOptions) => {
      return await query(store, options);
    },
    mutate: async (options: MutationOptions) => {
      return await query(store, {
        query: options.mutation,
        variables: options.variables
      });
    }
  };
};

export default createClient();
