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
import { IGraphQLClient } from "../graphql/client";
import { Dispatch, GetState } from "./commonTypes";
import { createAction } from "./createAction";
import { getStack } from "./getStack";

/**
 * Wrap your action to three-way async redux action
 * 
 * This wrapper automatically pass { dispatch, getState, client } object as
 * second argument to your function (as in usual redux thunk)
 * 
 * Also this wrapper allow to pass callbacks functions (which will be called
 * after `ok` and `error` actions) when you call action (will be shown below).
 * 
 * You can pass `flushOkMessage` and `flushErrorMessage` functions which will
 * be called after `ok` and `error` actions and show notifications in UI
 * 
 * Wrapped action automatically create and dispatch 3 redux actions internally:
 * 
 * 1. `dispatch(start({ args }))` where `args` is object which you passing to
 *     your action function (can be of any type, undefined it's ok, but `args`
 *     is required, so must be passed explicitly)
 * 
 * 2. `dispatch(ok({ args, result }))` where `result` is what your action
 *    function return (can be anything, undefined it's ok, so you can return
 *    anything)
 * 
 * 3. `dispatch(error({ args, error }))` where `error` is error from exception
 *    (have no type)
 * 
 * EXAMPLE:

// describe action interface
interface IYourActionArgs {
  readonly id: number;
}

// create action
export const yourAction = createAsyncAction({
  name: "Action Name",
  action: async (args: IYourActionArgs, { dispatch, getState, client }) => {
    const { id } = args;
    const result = await client.mutate({
      mutation: queries.someQuery,
      variables: { params: { id } }
    });
    return result;
  },
  flushOkMessage: (args, result) => `Some "${args.id}" was changed`,
  flushErrorMessage: (args, error) => `Failed to change with "${args.id}"`
}); 

`yourAction` now is object = {
  start,         // for redux reducer
  ok,            // for redux reducer
  error,         // for redux reducer
  action,        // wrapped action
  originalAction // your original function (`action` param)
}

// usage
...
const provider = provide({
  mapDispatchToProps: {
    yourAction: yourAction.action
  }
})
...
  componentDidMount() {
    this.props.yourAction({
      id: 17
    }, { // callbacks functions object (optional)
      onSuccess(result) {
        console.log(result); // `res` which returned from action
      },
      onError(error) {
        console.error(error); // some `error`
      }
    })
  }
...
 */

const createAsyncActionCreator = () => {
  const retryTimers: { [key: string]: any[] } = {};
  function createAsyncAction<Args, Result>({
    name,
    takeLatest = false,
    attempts = 1,
    timeout = 10000000,
    track = false,
    trackFn,
    action,
    flushOkMessage,
    flushErrorMessage
  }: {
    readonly name: string;
    readonly takeLatest?: boolean;
    readonly attempts?: number;
    readonly timeout?: number;
    readonly track?: boolean;
    readonly trackFn?: (
      args: Args,
      result: Result | undefined,
      EventTypes: any
    ) => any;
    readonly action: (
      args: Args,
      {
        dispatch,
        getState,
        client
      }: {
        readonly dispatch: Dispatch;
        readonly getState: GetState;
        readonly client: IGraphQLClient;
      }
    ) => Promise<Result>;
    readonly flushOkMessage?: (args: Args, result: Result) => string;
    readonly flushErrorMessage?: (args: Args, error: any) => string;
  }) {
    interface Meta {
      readonly stack: any;
    }
    interface OkMeta extends Meta {}
    const start = createAction<Args, undefined, Meta>(`⚡️ ${name} start`);
    const ok = createAction<Args, Result, OkMeta>(`✅ ${name} ok`);
    const error = createAction<Args, any, Meta>(`❗️ ${name} error`);

    let callsCounter = 0;
    retryTimers[name] = [];
    function wrappedAction(
      args: Args,
      callbacks?: {
        readonly onSuccess?: (result: Result) => void;
        readonly onError?: (error: string) => void;
      }
    ): (
      dispatch: Dispatch,
      getState: GetState,
      client: IGraphQLClient
    ) => Promise<Result> {
      const meta: Meta = {
        stack: getStack()
      };
      return async (
        dispatch: Dispatch,
        getState: GetState,
        client: IGraphQLClient
      ) => {
        const fixedCallsCounter = ++callsCounter;
        if (takeLatest) {
          retryTimers[name].forEach(clearTimeout);
        }
        const checker = () => !takeLatest || fixedCallsCounter === callsCounter;
        dispatch(start(args, undefined, meta));
        if (checker()) {
          let result;
          try {
            let attempt = 1;
            const callAction = async (): Promise<Result> => {
              try {
                const promiseAction = new Promise<Result>((resolve, reject) => {
                  const delayMs = (attempt - 1) * 2 * 1000;
                  const timer = setTimeout(async () => {
                    try {
                      resolve(
                        await action(args, { dispatch, client, getState })
                      );
                    } catch (error) {
                      reject(error);
                    } finally {
                      retryTimers[name] = retryTimers[name].filter(
                        t => t !== timer
                      );
                    }
                  }, delayMs);
                  retryTimers[name].push(timer);
                });
                return await promiseTimeout(timeout, promiseAction);
              } catch (err) {
                if (++attempt <= attempts) {
                  return await callAction();
                } else {
                  throw err;
                }
              }
            };
            result = await callAction();
          } catch (err) {
            if (checker()) {
              dispatch(error(args, err, meta));
              if (callbacks && callbacks.onError) {
                callbacks.onError(err);
              }
              if (flushErrorMessage) {
                if ("level" in err) {
                  if (notificationMethods) {
                    notificationMethods.flushError(
                      dispatch,
                      flushErrorMessage(args, err),
                      err
                    );
                  }
                } else {
                  if (notificationMethods) {
                    notificationMethods.flushError(
                      dispatch,
                      flushErrorMessage(args, err),
                      {
                        level: "critical",
                        error: err
                      }
                    );
                  }
                }
              }
              return err;
            }
          }
          if (checker()) {
            const okMeta: OkMeta = { ...meta };
            dispatch(ok(args, result, okMeta));
            if (callbacks && callbacks.onSuccess) {
              callbacks.onSuccess(result as any);
            }
            if (flushOkMessage && notificationMethods) {
              notificationMethods.flushOk(
                dispatch,
                flushOkMessage(args, result as any)
              );
            }
            return result;
          }
        }
      };
    }

    return {
      start,
      ok,
      error,
      action: wrappedAction,
      originalAction: action
    };
  }

  let notificationMethods:
    | null
    | import("../components/Notifications/state/actions").NotificationMethods = null;
  (createAsyncAction as any).setNotificationMethods = (
    methods: import("../components/Notifications/state/actions").NotificationMethods
  ) => {
    notificationMethods = methods;
  };

  return createAsyncAction as typeof createAsyncAction & {
    setNotificationMethods: (
      methods: import("../components/Notifications/state/actions").NotificationMethods
    ) => void;
  };
};

export const createAsyncAction = createAsyncActionCreator();

const promiseTimeout = function(ms: number, promise: Promise<any>) {
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject("Timed out in " + ms + "ms.");
    }, ms);
  });
  return Promise.race([promise, timeout]);
};
