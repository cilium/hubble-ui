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
import { provideWithRouter } from "../../state";
import { discoverCluster } from "../Clusters/state/actions";
import {
  getClusterIdFromParams,
  getFlowsEndDateFromParams,
  getFlowsStartDate,
  getFlowsStartDateFromParams,
  getNamespaceFromParams
} from "../Routing/state/selectors";
import { setNextDiscoveryTime } from "./state/actions";
import { DEFAULT_NAME_LABEL_KEYS } from "./state/defaults";

const provider = provideWithRouter({
  mapStateToProps: state => ({
    startDate: getFlowsStartDateFromParams(state),
    endDate: getFlowsEndDateFromParams(state),
    clusterId: getClusterIdFromParams(state),
    namespaceFromParams: getNamespaceFromParams(state)
  }),
  mapDispatchToProps: {
    discoverCluster: discoverCluster.action,
    setNextDiscoveryTime
  }
});

export const { Container: AppFetcherWithRouter } = provider(Props => {
  type Props = typeof Props;
  return class AppFetcherClass extends React.Component<Props> {
    rediscoverAppTimer: any;
    rediscoverFlowsTimer: any;
    rediscoverClusterTimer: any;

    componentDidMount() {
      this.rediscoverWithCleanup(this.props);
    }

    componentWillUnmount() {
      this.cleanUp();
    }

    componentWillReceiveProps(nextProps: Props) {
      if (
        this.props.startDate !== nextProps.startDate ||
        this.props.endDate !== nextProps.endDate
      ) {
        this.rediscoverWithCleanup(nextProps);
      } else if (
        this.props.clusterId !== nextProps.clusterId ||
        this.props.namespaceFromParams !== nextProps.namespaceFromParams
      ) {
        this.rediscoverWithCleanup(nextProps);
      }
    }

    cleanUp = () => {
      clearTimeout(this.rediscoverAppTimer);
      clearTimeout(this.rediscoverFlowsTimer);
      clearTimeout(this.rediscoverClusterTimer);
    };

    rediscover = (props: Props) => {
      this.rediscoverCluster(props);
    };

    rediscoverWithCleanup = (props: Props) => {
      this.cleanUp();
      this.rediscover(props);
    };

    rediscoverCluster = (props: Props) => {
      const delay = 20000;
      clearTimeout(this.rediscoverClusterTimer);
      // if (props.isMapLoading) {
      //   this.rediscoverClusterTimer = setTimeout(
      //     () => this.rediscoverCluster(this.props),
      //     delay
      //   );
      // } else {
      this.discoverCluster(props, () => {
        clearTimeout(this.rediscoverClusterTimer);
        this.rediscoverClusterTimer = setTimeout(
          () => this.rediscoverCluster(this.props),
          delay
        );
        this.props.setNextDiscoveryTime({
          date: moment().add("milliseconds", delay)
        });
      });
      // }
    };

    discoverCluster = (props: Props, callback: () => void) => {
      if (props.clusterId && props.namespaceFromParams) {
        props.discoverCluster(
          {
            clusterId: props.clusterId,
            excludedLabelKeys: [],
            nameLabelKeys: DEFAULT_NAME_LABEL_KEYS,
            namespaces: [props.namespaceFromParams],
            startedAfter: getFlowsStartDate(props.startDate)
          },
          { onSuccess: callback, onError: callback }
        );
      }
    };

    render() {
      return this.props.children;
    }
  };
});
