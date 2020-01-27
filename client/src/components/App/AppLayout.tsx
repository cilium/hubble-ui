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
import { domNodes } from "../../dom-nodes";
import { provideWithRouter } from "../../state";
import { store } from "../../state/store";
import { fetchClusters } from "../Clusters/state/actions";
import { AlertManagerContainer } from "../Common/AlertManager";
import { AppViewWithRouter } from "./AppView";
import { FullScreen } from "./FullScreen";

const css = require("./AppLayout.scss");

const provider = provideWithRouter({
  mapDispatchToProps: {
    fetchClusters: fetchClusters.action
  }
});

export const { Container: AppLayoutWithRouter } = provider(Props => {
  type Props = typeof Props;
  interface State {
    menuBarHovered: boolean;
  }
  return class AppLayoutClass extends React.Component<Props, State> {
    hoverTimeout: any;
    refetchClustersTimer: any;

    constructor(props: Props) {
      super(props);

      this.state = {
        menuBarHovered: false
      };
    }

    componentDidMount() {
      this.fetchClusters(this.props);
      domNodes.menuBarFaderRoot.addEventListener(
        "mouseenter",
        this.onMenuBarUnhover
      );
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }

    fetchClusters = (props: Props) => {
      props.fetchClusters({});
    };

    beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (store) {
        const state = store.getState();
        if (state) {
          // noop
        }
      }
      return "";
    };

    componentWillUnmount() {
      try {
        clearTimeout(this.refetchClustersTimer as any);
        window.removeEventListener("beforeunload", this.beforeUnloadHandler);
        domNodes.menuBarFaderRoot.removeEventListener(
          "mouseenter",
          this.onMenuBarUnhover
        );
      } catch (error) {}
    }

    onMenuBarHover = () => {
      this.hoverTimeout = setTimeout(() => {
        this.setState({ menuBarHovered: true });
        domNodes.menuBarFaderRoot.classList.add(css.showFader);
      }, 150);
    };

    onMenuBarUnhover = () => {
      clearTimeout(this.hoverTimeout);
      this.setState({ menuBarHovered: false });
      domNodes.menuBarFaderRoot.classList.remove(css.showFader);
    };

    render() {
      return (
        <FullScreen>
          <AlertManagerContainer>
            <div className={css.wrapper}>
              <Switch>
                <Route path={`/service-map`} component={AppViewWithRouter} />
              </Switch>
            </div>
          </AlertManagerContainer>
        </FullScreen>
      );
    }
  };
});
