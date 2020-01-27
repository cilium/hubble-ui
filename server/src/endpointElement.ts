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
import * as hash from "object-hash";
import { AppEndpoint, AppFunction, Protocol } from "./graphqlTypes";
import {
  functionIdRaw,
  getEndpointHash,
  protocolId
} from "./shared/generators";

export class EndpointElement {
  constructor(
    public endpoint: AppEndpoint,
    public protocol: Protocol | null,
    public func: AppFunction | null
  ) {}

  /**
   * Composed hash of all endpoint elements
   * This creates unique hash across all endpoint elements
   * and is needed to be able to "flatten" app model revision
   */
  hash() {
    return hash([
      this.endpointHash(),

      this.protocolHash(),
      this.functionHash()
    ]);
  }

  endpointHash() {
    return getEndpointHash(
      this.endpoint.labels,
      this.endpoint.v4Cidrs,
      this.endpoint.v6Cidrs,
      this.endpoint.dnsName
    );
  }

  protocolHash() {
    return this.protocol ? protocolId(this.endpoint, this.protocol) : hash("");
  }

  functionHash() {
    return this.protocol && this.func
      ? functionIdRaw(
          this.endpointHash(),
          this.protocolHash(),
          this.func.name,
          undefined,
          undefined
        )
      : hash("");
  }
}
