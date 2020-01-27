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
import * as React from "react";
import { Alert } from "@blueprintjs/core";

interface State {
  show: boolean;
  text: AlertText;
}

type AlertText = string | JSX.Element | null;
type Action = { type: "show"; payload: AlertText } | { type: "hide" };

const initialState: State = {
  show: false,
  text: null
};

const alertReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "show":
      return {
        ...state,
        show: true,
        text: action.payload
      };

    case "hide":
      return {
        ...state,
        show: false,
        text: null
      };

    default:
      return state;
  }
};

const hideAlert = (): Action => ({ type: "hide" });
const showAlert = (text: AlertText): Action => ({
  type: "show",
  payload: text
});

const AlertManagerContext = React.createContext<{
  dispatch?: React.Dispatch<Action>;
}>({});

export const AlertManagerContainer: React.SFC = props => {
  const [state, dispatch] = React.useReducer(alertReducer, initialState);
  const AlertManagerProvider = AlertManagerContext.Provider;

  return (
    <AlertManagerProvider value={{ dispatch }}>
      {props.children}
      <Alert
        isOpen={state.show}
        onClose={() => dispatch(hideAlert())}
        confirmButtonText="Cancel"
        icon="blocked-person"
        canEscapeKeyCancel={true}
        canOutsideClickCancel={true}
      >
        {state.text}
      </Alert>
    </AlertManagerProvider>
  );
};

export const useAlertManager = () => {
  const { dispatch } = React.useContext(AlertManagerContext);

  return {
    showAlert: (text: AlertText) => dispatch && dispatch(showAlert(text))
  };
};
