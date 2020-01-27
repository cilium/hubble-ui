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
import { Button } from "@blueprintjs/core";
import { provide } from "../../../src/state";
import { Cluster } from "../../../src/graphqlTypes";
import { fetchClusterCnps } from "../Clusters/state/actions";
import { downloadFile } from "../App/state/utils";
import { getClusterIdFromParams } from "../Routing/state/selectors";
import { Icon } from "../Misc/SVGIcon";

interface OwnProps {
  namespace: string;
  name: string;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({
    clusterId: getClusterIdFromParams(state)
  }),
  mapDispatchToProps: {
    fetchClusterCnps: fetchClusterCnps.action
  }
});

export const { Container: DownloadPolicy } = provider(() => props => {
  const [isFetching, setIsFetching] = React.useState<boolean>(false);
  const handleFetchSuccess = (data: Cluster[]) => {
    const { namespace, clusterId, name } = props;
    const cluster = data.find(({ id }) => id === clusterId);

    if (cluster && cluster.cnp) {
      const cnp = cluster.cnp.find(
        o => o.namespace === namespace && o.name === name
      );

      if (cnp) {
        downloadFile(cnp.name, cnp.yaml, "yaml");
      }
    }
    setIsFetching(false);
  };
  const handleFetchError = () => setIsFetching(false);
  const hanldeClick = () => {
    setIsFetching(true);
    props.fetchClusterCnps(
      {},
      {
        onSuccess: handleFetchSuccess,
        onError: handleFetchError
      }
    );
  };

  return (
    <Button
      minimal
      text={isFetching ? "Downloading..." : "Download"}
      rightIcon={<Icon name="download" size={12} color="#5C7080" />}
      onClick={hanldeClick}
      disabled={isFetching}
    />
  );
});
