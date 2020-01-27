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
declare module "react-collapse";

declare module "redux-persist";

declare module "react-tippy";

declare module "ip-address";

declare module "emoji-mart" {
  import {
    PickerProps,
    EmojiData,
    EmojiProps
  } from "node_modules/@types/emoji-mart";

  export { EmojiData, EmojiProps, Emoji } from "node_modules/@types/emoji-mart";

  interface EnhancedPickerProps extends PickerProps {
    readonly onSelect: (emoji: EmojiData) => void;
  }

  export class Picker extends React.PureComponent<EnhancedPickerProps> {
    // everything inside it is supposed to be private
  }
}

declare module "re-reselect" {
  export type Selector<S, R, P> = (state: S, props: P) => R;
  export type Resolver<S, P> = (state: S, props: P) => number | string;
  export type OutputSelector<S, R, P, C> = Selector<S, R, P> & {
    resultFunc: C;
    recomputations: () => number;
    resetRecomputations: () => number;
  };
  export type OutputCachedSelector<S, R, P, C> = (
    resolver: Resolver<S, P>
  ) => OutputSelector<S, R, P, C> & {
    getMatchingSelector: (
      state: S,
      ...args: any[]
    ) => OutputSelector<S, R, P, C>;
    removeMatchingSelector: (state: S, ...args: any[]) => void;
    clearCache: () => void;
    resultFunc: C;
  };
  export default function createCachedSelector<S, R1, R2, P, T>(
    selector1: Selector<S, R1, P>,
    selector2: Selector<S, R2, P>,
    combiner: (r1: R1, r2: R2, props: P) => T
  ): OutputCachedSelector<S, T, P, (r1: R1, r2: R2) => T>;
  export default function createCachedSelector<S, R1, R2, R3, P, T>(
    selector1: Selector<S, R1, P>,
    selector2: Selector<S, R2, P>,
    selector3: Selector<S, R3, P>,
    combiner: (r1: R1, r2: R2, r3: R3, props: P) => T
  ): OutputCachedSelector<S, T, P, (r1: R1, r2: R2, r3: R3) => T>;
  export default function createCachedSelector<S, R1, R2, R3, R4, P, T>(
    selector1: Selector<S, R1, P>,
    selector2: Selector<S, R2, P>,
    selector3: Selector<S, R3, P>,
    selector4: Selector<S, R4, P>,
    combiner: (r1: R1, r2: R2, r3: R3, r4: R4, props: P) => T
  ): OutputCachedSelector<S, T, P, (r1: R1, r2: R2, r3: R3, r4: R4) => T>;
  export default function createCachedSelector<S, R1, R2, R3, R4, R5, P, T>(
    selector1: Selector<S, R1, P>,
    selector2: Selector<S, R2, P>,
    selector3: Selector<S, R3, P>,
    selector4: Selector<S, R4, P>,
    selector5: Selector<S, R5, P>,
    combiner: (r1: R1, r2: R2, r3: R3, r4: R4, r5: R5, props: P) => T
  ): OutputCachedSelector<
    S,
    T,
    P,
    (r1: R1, r2: R2, r3: R3, r4: R4, r5: R5) => T
  >;
}

declare module "*.svg" {
  const content: any;
  export default content;
}
