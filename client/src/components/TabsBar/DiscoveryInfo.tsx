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
import * as React from "react";
import { provide } from "../../state";
import { getNextDiscoveryTime } from "../App/state/selectors";
import { Button, Intent } from "@blueprintjs/core";
import { toggleFlowsAutoRefresh } from "../Flows/state/actions";
import { getFlowsAutoRefresh } from "../Flows/state/selectors";

const css = require("./DiscoveryInfo.scss");

const provider = provide({
  mapStateToProps: state => ({
    autoRefresh: getFlowsAutoRefresh(state),
    nextDiscoveryTime: getNextDiscoveryTime(state)
  }),
  mapDispatchToProps: {
    toggleFlowsAutoRefresh: toggleFlowsAutoRefresh
  }
});

export const { Container: DiscoveryInfo } = provider(Props => {
  type PropsType = typeof Props;
  interface State {
    readonly discoveryAfter: number;
  }
  return class DiscoveryInfoClass extends React.Component<PropsType, State> {
    state: State = {
      discoveryAfter: 0
    };

    timer: any;

    componentDidMount() {
      this.startTimer(this.props);
    }

    componentWillReceiveProps(nextProps: typeof Props) {
      if (nextProps.nextDiscoveryTime !== this.props.nextDiscoveryTime) {
        clearInterval(this.timer);
        this.startTimer(nextProps);
      }
    }

    componentWillUnmount() {
      clearInterval(this.timer);
    }

    startTimer = (props: typeof Props) => {
      const { nextDiscoveryTime } = props;
      this.setState(
        {
          discoveryAfter: nextDiscoveryTime
            ? nextDiscoveryTime.diff(moment(), "seconds")
            : 0
        },
        () => {
          this.timer = setInterval(() => {
            this.setState(prevState => ({
              discoveryAfter: prevState.discoveryAfter - 1
            }));
          }, 1000);
        }
      );
    };

    onAutoRefreshClick = () => {
      this.props.toggleFlowsAutoRefresh();
    };

    render() {
      const { discoveryAfter } = this.state;
      const showDiscoveryAfter = discoveryAfter >= 0;
      return (
        <div className={css.wrapper}>
          <div className={css.discoveryAfter}>
            <Button
              minimal
              icon="play"
              intent={this.props.autoRefresh ? Intent.SUCCESS : Intent.NONE}
              onClick={this.onAutoRefreshClick}
              text={
                (!this.props.autoRefresh && "Enable updates") ||
                (this.props.autoRefresh &&
                  showDiscoveryAfter &&
                  `Update in ${discoveryAfter}s`) ||
                (this.props.autoRefresh && "Updating...")
              }
            />
          </div>
        </div>
      );
    }
  };
});
