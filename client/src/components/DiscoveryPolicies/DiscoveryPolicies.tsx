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
import { NonIdealState, Spinner } from "@blueprintjs/core";
import { css } from "linaria";
import * as React from "react";
import { CiliumNetworkPolicy, PolicySpecs } from "src/graphqlTypes";
import { provide } from "src/state";
import { getCurrentEndpoint } from "../App/state/selectors";
import { fetchClusterCnps } from "../Clusters/state/actions";
import {
  getClusterIdFromParams,
  getNamespaceFromParams
} from "../Routing/state/selectors";
import { fetchPolicySpecs } from "../TroubleshootingView/state/actions";
import { PoliciesList } from "./PoliciesList";
import { PolicyYAMLViewer } from "./PoliciyYAMLViewer";
import { setCNPs, setLoading, setSelected, setSpecs } from "./state/actions";
import { discoveryPoliciesReducer, initialState } from "./state/reducer";

const provider = provide({
  mapStateToProps: state => ({
    clusterId: getClusterIdFromParams(state),
    namespaceFromParams: getNamespaceFromParams(state),
    serviceFromParams: getCurrentEndpoint(state)
  }),
  mapDispatchToProps: {
    fetchClusterCnps: fetchClusterCnps.action,
    fetchPolicySpecs: fetchPolicySpecs.action
  }
});

const container = css`
  display: flex;
  width: 100%;
  height: 100%;
`;

export const { Container: DiscoveryPolicies } = provider(() => props => {
  const { clusterId, namespaceFromParams, serviceFromParams } = props;
  const [{ cnps, specs, selected, loading }, dispatch] = React.useReducer(
    discoveryPoliciesReducer,
    initialState
  );
  const onSelectPolicy = (policy: CiliumNetworkPolicy) => {
    dispatch(setSelected(policy));
  };

  React.useEffect(() => {
    if (!clusterId) {
      return;
    }

    const handleError = () => dispatch(setLoading());
    dispatch(setLoading());

    if (serviceFromParams) {
      props.fetchPolicySpecs(
        {
          filterBy: {
            clusterId,
            labels: serviceFromParams.labels
          }
        },
        {
          onSuccess: data => {
            dispatch(setSpecs(data));
          },
          onError: handleError
        }
      );
    } else {
      props.fetchClusterCnps(
        {},
        {
          onSuccess: clusters => {
            const cluster = clusters.find(cluster => cluster.id === clusterId);

            if (cluster) {
              const cnps = cluster.cnp
                ? cluster.cnp.filter(
                    cnp => cnp.namespace === namespaceFromParams
                  )
                : [];

              dispatch(setCNPs(cnps));
            }
          },
          onError: handleError
        }
      );
    }
  }, [clusterId, namespaceFromParams, serviceFromParams]);

  if (loading) {
    return (
      <div className={container}>
        <NonIdealState title="Loading..." icon={<Spinner />} />
      </div>
    );
  }

  if (serviceFromParams ? specs.length === 0 : cnps.length === 0) {
    return (
      <div className={container}>
        <NonIdealState title="No policies" icon="disable" />
      </div>
    );
  }

  return (
    <div className={container}>
      <PoliciesList
        data={serviceFromParams ? specs : cnps}
        selected={selected}
        onSelect={onSelectPolicy}
      />
      <PolicyYAMLViewer
        data={
          serviceFromParams
            ? (selected as PolicySpecs)
            : (selected as CiliumNetworkPolicy)
        }
      />
    </div>
  );
});
