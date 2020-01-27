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
import * as bunyan from "bunyan";
import { GraphQLError, GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";
import * as moment from "moment";
import { IConfigDatabase } from "./configDb";
import { IDatabase } from "./db";

function validateDateTime(value: any) {
  if (!moment(value, moment.ISO_8601).isValid()) {
    throw new GraphQLError(`Invalid value for DateTime: ${value}`);
  }
  return value;
}

export const DateTimeType = new GraphQLScalarType({
  name: "DateTime",

  parseLiteral: ast => {
    if (ast.kind !== Kind.STRING) {
      throw new GraphQLError(`Invalid type for DateTime: ${ast.kind}`);
    }
    return validateDateTime(ast.value);
  },

  parseValue: value => validateDateTime(value),

  serialize: value => value
});

export interface IContext {
  readonly logger: bunyan;
  readonly user: User;
  readonly database: IDatabase;
  readonly configDatabase: IConfigDatabase;
  readonly hostname: string;
  readonly clusterHealthTimeoutSeconds: number;
}

export class User {
  public constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly token: string
  ) {}
}

export interface IClusterSelectedFields {
  namespaces?: boolean;
  unmanagedPods?: boolean;
  clusterStatus?: boolean;
  cnp?: boolean;
  cep?: boolean;
  namespaceBaselinePolicyAssignment?: boolean;
  agentUpgradeInfo?: boolean;
  exporterUpgradeInfo?: boolean;
  knp?: boolean;
}
