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
import { RouterState } from "connected-react-router";
import { reducer as newappReducer } from "../components/App/state/reducer";
import { State as NewAppState } from "../components/App/state/types";
import { reducer as clustersReducer } from "../components/Clusters/state/reducer";
import { State as ClustersState } from "../components/Clusters/state/types";
import { reducer as flowsReducer } from "../components/Flows/state/reducer";
import { State as FlowsState } from "../components/Flows/state/types";
import { reducer as mapReducer } from "../components/MapView/state/reducer";
import { State as MapState } from "../components/MapView/state/types";
import { reducer as modalReducer } from "../components/Modal/state/reducer";
import { State as ModalState } from "../components/Modal/state/types";
import { reducer as notificationsReducer } from "../components/Notifications/state/reducer";
import { State as NotificationsState } from "../components/Notifications/state/types";
import { reducer as authReducer } from "./auth/reducer";
import { State as AuthState } from "./auth/types";

export interface RootState {
  readonly auth: AuthState;
  readonly modal: ModalState;
  readonly notifications: NotificationsState;
  readonly clusters: ClustersState;
  readonly router: RouterState;
  readonly newapp: NewAppState;
  readonly flows: FlowsState;
  readonly map: MapState;
}

export const reducers = {
  auth: authReducer,
  modal: modalReducer,
  notifications: notificationsReducer,
  clusters: clustersReducer,
  newapp: newappReducer,
  flows: flowsReducer,
  map: mapReducer
};
