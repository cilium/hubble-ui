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
import { Checkbox } from "@blueprintjs/core";
import * as React from "react";
import { Flow } from "../../graphqlTypes";
import { provide } from "../../state";
import { toggleFlowToPolicy } from "./state/actions";
import { getIsFlowToPolicyChecked } from "./state/selectors";

interface OwnProps {
  readonly flow: Flow;
}

const provider = provide({
  mapStateToProps: (state, { flow }: OwnProps) => ({
    checked: getIsFlowToPolicyChecked(state, flow.id)
  }),
  mapDispatchToProps: {
    toggleFlowToPolicy: toggleFlowToPolicy
  }
});

export const { Container: FlowsTableRowCheckbox } = provider(() => props => {
  return (
    <Checkbox
      className="add-flows-to-policy-checkbox"
      onChange={() => props.toggleFlowToPolicy(props.flow)}
      checked={props.checked}
    />
  );
});
