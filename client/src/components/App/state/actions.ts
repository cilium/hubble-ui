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
import * as moment from "moment";
import { createAction } from "../../../state";
import { MapFilters } from "src/components/MapView/state/types";

/**
 * UPDATE SCREEN DIMENSIONS
 */
export const updateScreenDimensions = createAction<{
  width: number;
  height: number;
}>("🖥 Update screen dimensions");

/**
 * SET NEXT DISCOVERY TIME
 */
export const setNextDiscoveryTime = createAction<{
  date: moment.Moment;
}>("Set next discovery time");

export const toggleTrafficFilter = createAction<{
  filter: keyof MapFilters;
}>("Toggle Traffic Filter");
