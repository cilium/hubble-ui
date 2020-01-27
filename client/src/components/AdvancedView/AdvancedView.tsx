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
import { Route, Switch } from "react-router";
import { provideWithRouter } from "../../state";
import { DiscoveryPolicies } from "../DiscoveryPolicies/DiscoveryPolicies";
import { DraggableView } from "../DraggableView/DraggableView";
import { FlowsTable } from "../Flows/FlowsTable";
import { replaceAppUrl } from "../Routing/state/actions";
import { getFlowQueryFromParams } from "../Routing/state/selectors";
import { AppAdvancedViewType } from "../Routing/state/types";
import { Sidebar } from "../TroubleshootingView/Sidebar";

const css = require("./AdvancedView.scss");

const provider = provideWithRouter({
  mapDispatchToProps: {
    replaceAppUrl
  }
});

export const { Container: AdvancedView } = provider(Props => {
  type Props = typeof Props;
  return class AdvancedViewClass extends React.Component<Props> {
    render() {
      return (
        <DraggableView>
          <Switch>
            <Route
              path={`/service-map/clusters/:clusterId/:discoveryClusterNamespaces/${AppAdvancedViewType.FLOWS}`}
              component={FlowsTableWithSidebar}
            />
            <Route
              path={`/service-map/clusters/:clusterId/:discoveryClusterNamespaces/${AppAdvancedViewType.POLICIES}`}
              component={DiscoveryPolicies}
            />
          </Switch>
        </DraggableView>
      );
    }
  };
});

const flowsTableProvider = provideWithRouter({
  mapStateToProps: state => {
    const flow = getFlowQueryFromParams(state);
    return {
      hasSelectedFlow: Boolean(flow) && flow !== "none"
    };
  }
});
const { Container: FlowsTableWithSidebar } = flowsTableProvider(Props => {
  type Props = typeof Props;
  return class FlowsTableWithSidebarClass extends React.Component<Props> {
    render() {
      return (
        <div className={css.flowsTableOuterWrapper}>
          <div className={css.flowsTableInnerWrapper}>
            <div className={css.flowsTableWrapper}>
              <FlowsTable />
            </div>
            {this.props.hasSelectedFlow && (
              <div className={css.flowsTableSidebarWrapper}>
                <Sidebar />
              </div>
            )}
          </div>
        </div>
      );
    }
  };
});
