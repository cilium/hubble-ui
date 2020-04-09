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
import { useCallback, useReducer } from "react";

type VoidFunction = () => void;

const reducer = (state: number, _action: null): number => (state + 1) % 0xffffff;

export const useForceUpdate = (): VoidFunction => {
  const [, dispatch] = useReducer(reducer, 0);
  const memoizedDispatch = useCallback((): void => {
    dispatch(null);
  }, [dispatch]);
  return memoizedDispatch;
};
