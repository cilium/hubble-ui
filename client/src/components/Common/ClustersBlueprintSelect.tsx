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
import { HTMLSelect } from "@blueprintjs/core";
import { sortBy } from "lodash";
import * as React from "react";
import { provide } from "../../state";
import { getClustersListMappedWithSelected } from "../Clusters/state/selectors";
import { pushAppUrl } from "../Routing/state/actions";
import { getClusterIdFromParams } from "../Routing/state/selectors";

interface OwnProps {
  autoSelectCluster?: boolean;
  onChange(clusterId: string): void;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({
    clusters: getClustersListMappedWithSelected(state),
    clusterId: getClusterIdFromParams(state)
  }),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

export const { Container: ClustersBlueprintSelect } = provider(Props => {
  type Props = typeof Props;
  return class ClustersSelectlass extends React.Component<Props> {
    componentWillReceiveProps(nextProps: Props) {
      if (nextProps.autoSelectCluster) {
        if (!nextProps.clusterId) {
          if (nextProps.clusters && nextProps.clusters.length > 0) {
            nextProps.pushAppUrl({
              clusterId: nextProps.clusters[0].cluster.id
            });
          }
        }
      }
    }
    onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      this.props.onChange(event.target.value);
    };

    getOptions = () => {
      const { clusters } = this.props;
      let options: Array<{ label: string; value: string }> = [];
      if (clusters) {
        options = clusters.map(({ cluster: { id, name } }) => ({
          label: name,
          value: id
        }));
      }
      return sortBy(options, ["label"]);
    };

    render() {
      const options = this.getOptions();
      const hasOptions = options.length > 0;
      return (
        <HTMLSelect value={this.props.clusterId || ""} onChange={this.onChange}>
          {hasOptions ? (
            options.map(option => {
              return (
                <option
                  key={option.value as string}
                  value={option.value as string}
                >
                  {option.label}
                </option>
              );
            })
          ) : (
            <option>Loading clusters...</option>
          )}
        </HTMLSelect>
      );
    }
  };
});
