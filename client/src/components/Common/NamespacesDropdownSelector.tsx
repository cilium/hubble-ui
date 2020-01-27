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
import { css } from "linaria";
import { Button, ButtonGroup, MenuItem } from "@blueprintjs/core";
import { ItemRenderer, Select } from "@blueprintjs/select";
import * as React from "react";
import { provide } from "src/state";
import { getClusterNamespacesById } from "../Clusters/state/selectors";
import { pushAppUrl } from "../Routing/state/actions";
import { getClusterIdFromParams } from "../Routing/state/selectors";
import { getNamespaceFromParams } from "../Routing/state/selectors";
import { filterItem, highlightText } from "../Common/utils/selectors";

export interface OwnProps {
  readonly clearable?: boolean;
  readonly autoSelectFirstNamespace?: boolean;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => {
    const clusterId = getClusterIdFromParams(state);
    return {
      namespaces: clusterId ? getClusterNamespacesById(state, clusterId) : [],
      namespaceFromParams: getNamespaceFromParams(state),
      clusterId
    };
  },
  mapDispatchToProps: {
    pushAppUrl
  }
});

const buttonText = css`
  overflow: hidden;
  width: 120px;
  text-overflow: ellipsis;
  white-space: pre;
`;

const NamespaceSelect = Select.ofType<string>();

export const { Container: NamespacesDropdownSelector } = provider(
  () => props => {
    React.useEffect(() => {
      if (props.clusterId) {
        if (props.namespaceFromParams) {
          if (
            !props.namespaces ||
            props.namespaces.length === 0 ||
            !props.namespaces.find(n => n === props.namespaceFromParams)
          ) {
            props.pushAppUrl({ namespaces: null });
            return;
          }
        } else if (props.namespaces && props.namespaces.length > 0) {
          const prevNamespace = localStorage.getItem("selected-namespace");
          if (prevNamespace) {
            if (props.namespaces.some(n => n === prevNamespace)) {
              props.pushAppUrl({ namespaces: prevNamespace });
              return;
            }
          }
          if (props.autoSelectFirstNamespace) {
            props.pushAppUrl({ namespaces: props.namespaces[0] });
            return;
          }
        }
      }
    }, [
      props.clusterId,
      props.namespaceFromParams,
      props.namespaces,
      props.autoSelectFirstNamespace
    ]);

    const onChange = (namespace: string) => {
      localStorage.setItem("selected-namespace", namespace);
      props.pushAppUrl({ namespaces: namespace });
    };

    const onReset = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      localStorage.removeItem("selected-namespace");
      props.pushAppUrl({ namespaces: null });
    };

    const renderItem: ItemRenderer<string> = (
      namespace,
      { handleClick, modifiers, query }
    ) => {
      if (!modifiers.matchesPredicate) {
        return null;
      }
      return (
        <MenuItem
          {...modifiers}
          key={namespace}
          onClick={handleClick}
          text={highlightText(namespace, query)}
        />
      );
    };

    return (
      <NamespaceSelect
        resetOnQuery
        resetOnClose
        resetOnSelect
        itemPredicate={filterItem}
        itemRenderer={renderItem}
        items={props.namespaces || []}
        noResults={<MenuItem disabled={true} text="No matches" />}
        onItemSelect={onChange}
      >
        <ButtonGroup>
          <Button
            small
            rightIcon="caret-down"
            icon={
              <img
                src={require("../assets/icons/namespace-icon.svg")}
                style={{ width: "14px" }}
              />
            }
            text={
              <div className={buttonText}>
                {props.namespaceFromParams
                  ? props.namespaceFromParams
                  : "Namespace"}
              </div>
            }
          />
          {props.clearable && props.namespaceFromParams && (
            <Button small icon="cross" onClick={onReset} />
          )}
        </ButtonGroup>
      </NamespaceSelect>
    );
  }
);
