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
import { Button, Intent } from "@blueprintjs/core";
import * as React from "react";
import { provide } from "../../state";
import { toggleFlowsAutoRefresh } from "../Flows/state/actions";
import { getFlowsAutoRefresh } from "../Flows/state/selectors";
import { pushAppUrl } from "../Routing/state/actions";

const provider = provide({
  mapStateToProps: state => ({
    autoRefresh: getFlowsAutoRefresh(state)
  }),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl,
    toggleFlowsAutoRefresh: toggleFlowsAutoRefresh
  }
});

export const { Container: AutoRefresh } = provider(() => props => {
  const onClick = () => {
    if (!props.autoRefresh) {
      props.pushAppUrl({
        flowsStartDate: {
          url: `1 hour`,
          label: `1 hour`
        },
        flowsEndDate: undefined
      });
    }
    props.toggleFlowsAutoRefresh();
  };
  return (
    <Button
      minimal
      icon="play"
      style={{ marginRight: "10px" }}
      intent={props.autoRefresh ? Intent.SUCCESS : Intent.NONE}
      onClick={onClick}
      text="Auto Refresh"
    />
  );
});
