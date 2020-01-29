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
import { PolicySpecs, UserPolicySpecsArgs } from "../../../graphqlTypes";
import { createAsyncAction } from "../../../state";
import { GqlResult } from "../../App/state/types";
import * as queries from "./queries";

export const fetchPolicySpecs = createAsyncAction({
  name: "Fetch Policy Specs",
  action: async (
    args: UserPolicySpecsArgs,
    { client }
  ): Promise<PolicySpecs[]> => {
    type ResultType = GqlResult<{ policySpecs: PolicySpecs[] }>;
    const { data } = await client.query<ResultType>({
      query: queries.getPolicySpecs,
      variables: {
        ...args
      }
    });

    return data.viewer.policySpecs;
  }
});
