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
import * as fs from "fs";
import * as path from "path";
import { InMemoryLRUCache } from "apollo-server-caching";
import { GraphQLExtension } from "graphql-extensions";
import { ClientError } from "../errors";
import { resolvers } from "../resolvers";
const { ApolloServer, makeExecutableSchema } = require("apollo-server-express");

/**
 * Reads graphql schema from file schema.graphql
 * Not memorized
 */
export const getGraphqlSchema = (): string => {
  return fs.readFileSync(path.join(__dirname, "../schema.graphql"), "utf8");
};

// From https://github.com/apollographql/apollo-server/issues/1681
class ErrorTrackingExtension extends GraphQLExtension {
  willSendResponse(o) {
    const { context, graphqlResponse } = o;
    (graphqlResponse.errors || []).forEach(err => {
      err.extensions && err.extensions.code === ClientError.prefix
        ? context.logger.info({ err })
        : context.logger.error({ err });
    });
  }
}

/**
 * Returns formated error message from Error instance
 * @param err Error instance
 */
export function getErrorMessage(err: Error) {
  return err.message.startsWith(ClientError.prefix)
    ? err.message.substr(ClientError.prefix.length + 1)
    : err.message;
}

/**
 * Configures and returns an instance of ApolloServer
 * @param apiKey API Key for commercial apollo metrics engine
 */
export function getApolloServer() {
  const schema = getGraphqlSchema();
  const graphqlSchema = makeExecutableSchema({
    allowUndefinedInResolve: true,
    resolverValidationOptions: {
      requireResolversForResolveType: false
    },
    resolvers,
    typeDefs: schema
  });

  return new ApolloServer({
    schema: graphqlSchema,
    extensions: [() => new ErrorTrackingExtension()],
    context: ({ req }) => req.context,
    introspection: true,
    tracing: true,
    cache: new InMemoryLRUCache({ maxSize: 100 }),
    formatError: err => {
      if (err.extensions) {
        if (process.env.NODE_ENV === "production") {
          // Hide stacktrace in production.
          delete err.extensions.exception;
        }
        if (err.message.startsWith(ClientError.prefix)) {
          err.extensions.code = ClientError.prefix;
        }
      }
      return {
        ...err,
        message: getErrorMessage(err)
      };
    },
    playground: {
      settings: {
        "editor.cursorShape": "block",
        "editor.theme": "light",
        "request.credentials": "same-origin"
      }
    }
  });
}
