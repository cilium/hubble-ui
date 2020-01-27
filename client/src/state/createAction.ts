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
import { getStack } from "./getStack";

const ids: { [key: string]: boolean } = {};

export interface Action<Args = any, Payload = any, Meta = any> {
  readonly type: string;
  readonly args: Args;
  readonly payload: Payload;
  readonly meta: Meta;
}

export interface ActionCreator<Args, Payload, Meta> {
  (args?: Args, payload?: Payload, meta?: Meta): Action<Args, Payload, Meta>;
  readonly type: string;
  readonly argsType: Args;
  readonly payloadType: Payload;
  readonly actionType: Action<Args, Payload>;
}

export function createAction<Args = undefined, Payload = Args, Meta = {}>(
  type: string
): ActionCreator<Args, Payload, Meta> {
  check(type);
  add(type);
  const action: any = (args?: Args, payload?: Payload, meta?: Meta) => {
    const finalMeta = typeof meta === "undefined" ? {} : meta;
    if (!("stack" in finalMeta)) {
      (finalMeta as any).stack = getStack();
    }
    return {
      type,
      args,
      payload: typeof payload === "undefined" ? args : payload,
      meta: {
        ...finalMeta
      }
    };
  };
  action.type = type;
  return action;
}

function add(type: string) {
  ids[type] = true;
}

function check(type: string) {
  if (has(type)) {
    throw new TypeError(`Duplicate action type: ${type}`);
  }
}

function has(type: string) {
  return Boolean(ids[type]);
}
