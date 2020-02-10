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
import { Route, RouteComponentProps, Switch, withRouter } from "react-router";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { provideWithRouter } from "../../state";
import { AdvancedView } from "../AdvancedView/AdvancedView";
import {
  getClusters,
  getClustersFetchedOkAtLeastOnce
} from "../Clusters/state/selectors";
import { EmptyClustersStub } from "../Misc/EmptyStubs";
import { TabsBar } from "../TabsBar/TabsBar";
import { AppFetcherWithRouter } from "./AppFetcher";
import "./AppView.global.scss";
import { ErrorView } from "./ErrorView";
import { LoadingAppView } from "./LoadingAppView";
import { LoadingView } from "./LoadingView";

const css = require("./AppView.scss");

const provider = provideWithRouter({
  mapStateToProps: state => ({
    hasClusters: getClusters(state).length > 0,
    clustersFetchedOkAtLeastOnce: getClustersFetchedOkAtLeastOnce(state)
  })
});

export const { Container: AppViewWithRouter } = provider(Props => {
  type Props = typeof Props;
  return class AppViewClass extends React.Component<Props> {
    render() {
      const { hasClusters, clustersFetchedOkAtLeastOnce } = this.props;
      if (!clustersFetchedOkAtLeastOnce) {
        return <LoadingAppView />;
      } else if (clustersFetchedOkAtLeastOnce && !hasClusters) {
        return <EmptyClustersStub />;
      }
      return (
        <TransitionGroup className={css.outerWrapper}>
          <CSSTransition appear classNames="appview" timeout={500}>
            <div className={css.outerWrapper}>
              <Switch>
                <Route
                  // prettier-ignore
                  path={`/service-map`}
                  component={MainAppView}
                />
              </Switch>
            </div>
          </CSSTransition>
        </TransitionGroup>
      );
    }
  };
});

const MainAppView = withRouter((props: RouteComponentProps<any>) => (
  <div className={css.wrapper}>
    <Switch>
      <Route
        // prettier-ignore
        path={`/service-map`}
        render={props => (
          <>
            <LoadingView transparent={true} />
            <ErrorView />
            <TabsBar />
            <AdvancedView />
          </>
        )}
      />
    </Switch>
  </div>
));
