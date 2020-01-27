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
import { Button, ButtonGroup } from "@blueprintjs/core";
import * as React from "react";
import { provide } from "../../state";
import { pushAppUrl } from "../Routing/state/actions";
import { getAppAdvancedViewTypeFromParams } from "../Routing/state/selectors";
import { AppAdvancedViewType } from "../Routing/state/types";

const provider = provide({
  mapStateToProps: state => ({
    appAdvancedViewType: getAppAdvancedViewTypeFromParams(state)
  }),
  mapDispatchToProps: {
    pushAppUrl
  }
});

export const { Container: ModeTabs } = provider(Props => {
  type Props = typeof Props;
  return class ModeTabsClass extends React.Component<Props> {
    onFlowsTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      this.props.pushAppUrl({
        appAdvancedViewType: AppAdvancedViewType.FLOWS,
        flowsQuery: undefined
      });
    };

    onPoliciesTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      this.props.pushAppUrl({
        appAdvancedViewType: AppAdvancedViewType.POLICIES
      });
    };

    render() {
      const { appAdvancedViewType } = this.props;
      const isFlows = appAdvancedViewType === AppAdvancedViewType.FLOWS;
      const isPolicies = appAdvancedViewType === AppAdvancedViewType.POLICIES;

      return (
        <ButtonGroup>
          <Button
            small
            active={isFlows}
            text="Flows"
            onClick={this.onFlowsTabClick}
          />
          <Button
            small
            active={isPolicies}
            text="Policies"
            onClick={this.onPoliciesTabClick}
          />
        </ButtonGroup>
      );
    }
  };
});
