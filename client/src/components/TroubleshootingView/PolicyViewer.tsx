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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { NonIdealState, Spinner, HTMLSelect } from "@blueprintjs/core";
import { provide } from "src/state";
import { fetchPolicySpecs } from "./state/actions";
import { PolicySpecs, PolicySpecsFilterInput } from "src/graphqlTypes";
import { Icon } from "../Misc/SVGIcon";
import { getFlowQueryFromParams } from "../Routing/state/selectors";
import { SpecsTypes } from "./state/types";
import { DownloadPolicy } from "./DownloadPolicy";

interface OwnProps {
  filterBy: PolicySpecsFilterInput;
  type: SpecsTypes;
}

const css = require("./PolicyViewer.scss");
const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({
    flowQuery: getFlowQueryFromParams(state)
  }),
  mapDispatchToProps: {
    fetchPolicySpecs: fetchPolicySpecs.action
  }
});
const selectOptions = [
  {
    label: "All",
    value: "all"
  },
  {
    label: "Ingress",
    value: "ingressSpecs"
  },
  {
    label: "Egress",
    value: "egressSpecs"
  }
];

export const { Container: PolicyViewer } = provider(() => props => {
  const [specs, setSpecs] = React.useState<PolicySpecs[]>([]);
  const [isFetching, setIsFetching] = React.useState<boolean>(false);
  const [type, setType] = React.useState<SpecsTypes>(props.type);
  const fetchSpecs = () => {
    setIsFetching(true);
    props.fetchPolicySpecs(
      { filterBy: props.filterBy },
      // { filterBy: { clusterId: props.filterBy.clusterId } }, // for testing
      {
        onSuccess: specs => {
          setSpecs(specs);
          setIsFetching(false);
        },
        onError: () => setIsFetching(false)
      }
    );
  };
  const filterSpecs = (specs: PolicySpecs[]): PolicySpecs[] => {
    if (type === "all") {
      return specs;
    }

    return specs.reduce((cur, { ingressSpecs, egressSpecs, ...restSpec }) => {
      const filteredSpecs: Pick<PolicySpecs, "ingressSpecs" | "egressSpecs"> =
        type === "egressSpecs"
          ? {
              ingressSpecs: [],
              egressSpecs
            }
          : { ingressSpecs, egressSpecs: [] };

      return [
        ...cur,
        {
          ...restSpec,
          ...filteredSpecs
        }
      ];
    }, []);
  };
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
    setType(event.target.value as SpecsTypes);

  React.useEffect(fetchSpecs, [props.filterBy, props.flowQuery]);
  React.useEffect(() => setType(props.type), [props.type]);

  if (isFetching) {
    return (
      <div className={css.container}>
        <NonIdealState title="Loading..." icon={<Spinner />} />
      </div>
    );
  }

  if (!specs.length) {
    return (
      <div className={css.container}>
        <NonIdealState title="No data" icon="disable" />
      </div>
    );
  }

  return (
    <div className={css.container}>
      <div className={css.header}>
        <div className={css.title}>Flow policies</div>
        <HTMLSelect
          className={css.select}
          value={type}
          onChange={handleTypeChange}
        >
          {selectOptions.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </HTMLSelect>
      </div>
      <div className={css.policySpecs}>
        {filterSpecs(specs).map(policySpecs => (
          <div className={css.policySpec}>
            <div className={css.policyHeader}>
              <div className={css.specName}>
                <Icon
                  name="document"
                  size={12}
                  color="#7b7b7b"
                  marginRight={5}
                />
                <span title={policySpecs.policyName}>
                  {policySpecs.policyName}
                </span>
              </div>
              <DownloadPolicy
                name={policySpecs.policyName}
                namespace={policySpecs.policyNamespace}
              />
            </div>
            {type === "all" && (
              <div className={css.header}>
                <div className={css.title}>Ingress specs</div>
              </div>
            )}
            {policySpecs.ingressSpecs.map(spec => (
              <div className={css.code}>
                <SyntaxHighlighter language="yaml">{spec}</SyntaxHighlighter>
              </div>
            ))}
            {type === "all" && (
              <div className={css.header}>
                <div className={css.title}>Egress specs</div>
              </div>
            )}
            {policySpecs.egressSpecs.map(spec => (
              <div className={css.code}>
                <SyntaxHighlighter language="yaml">{spec}</SyntaxHighlighter>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
