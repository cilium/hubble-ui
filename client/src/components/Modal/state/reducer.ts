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
import { Action } from "src/state/createAction";
import { domNodes } from "../../../dom-nodes";
import { State } from "./types";
import { showModal, hideModal } from "./actions";

const initialState: State = {
  components: []
};

export const reducer = (state = initialState, action: Action): State => {
  switch (action.type) {
    case showModal.type: {
      const { payload } = action as typeof showModal.actionType;
      domNodes.modalsRoot.style.display = "block";
      return {
        ...state,
        components: state.components.concat(payload)
      };
    }
    case hideModal.type: {
      const components = state.components.slice(0, state.components.length - 1);
      if (components.length <= 0) {
        domNodes.modalsRoot.style.display = "none";
      }
      return {
        ...state,
        components
      };
    }
    default:
      return state;
  }
};
