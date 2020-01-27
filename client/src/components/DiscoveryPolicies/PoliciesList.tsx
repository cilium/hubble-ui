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
import { css } from "linaria";
import { provide } from "src/state";
import { Menu, MenuItem } from "@blueprintjs/core";
import { CiliumNetworkPolicy, PolicySpecs } from "src/graphqlTypes";
import * as moment from "moment";
import { Icon } from "../Misc/SVGIcon";
import { isPolicySpecs } from "./state/utils";

interface OwnProps {
  data: CiliumNetworkPolicy[] | PolicySpecs[];
  selected: CiliumNetworkPolicy | PolicySpecs | null;
  onSelect(policy: CiliumNetworkPolicy | PolicySpecs): void;
}

const provider = provide({
  mapStateToProps: (_state, _ownProps: OwnProps) => ({})
});

const textColor = "#C2C2C2";
const container = css`
  flex: 0 0 365px;
  padding: 0 15px 0 10px;
  overflow-y: auto;
  overflow-x: hidden;

  .bp3-menu-item {
    height: 34px;
    align-items: center;
    padding: 3px 13px;
    color: ${textColor};
  }

  .bp3-active {
    background-color: #f2f4f6 !important;
    color: #182026 !important;

    .bp3-menu-item-label {
      color: #7c8389 !important;
    }
  }

  .bp3-menu-item-label {
    color: ${textColor} !important;
  }

  .bp3-text-overflow-ellipsis {
    padding-left: 3px;
  }
`;

const isPolicySelected = (
  selected: CiliumNetworkPolicy | PolicySpecs | null,
  current: CiliumNetworkPolicy | PolicySpecs
) => {
  if (selected) {
    if (isPolicySpecs(selected)) {
      const [s, c] = [selected, current] as [PolicySpecs, PolicySpecs];

      return (
        s.policyName === c.policyName && s.policyNamespace === s.policyNamespace
      );
    } else {
      const [s, c] = [selected, current] as [
        CiliumNetworkPolicy,
        CiliumNetworkPolicy
      ];

      return s.name === c.name && s.creationTimestamp === c.creationTimestamp;
    }
  }

  return false;
};

export const { Container: PoliciesList } = provider(() => props => {
  const { data, selected } = props;
  let content: React.ReactElement[] = [];

  if (data.length && isPolicySpecs(data)) {
    content = (data as PolicySpecs[]).map(p => {
      const active = isPolicySelected(selected as CiliumNetworkPolicy, p);

      return (
        <MenuItem
          text={p.policyName}
          active={active}
          onClick={() => props.onSelect(p)}
          icon={
            <Icon
              name="policy"
              color={active ? "#137CBD" : textColor}
              size={[17, 19]}
            />
          }
        />
      );
    });
  } else {
    content = (data as CiliumNetworkPolicy[]).map(p => {
      const active = isPolicySelected(selected as CiliumNetworkPolicy, p);

      return (
        <MenuItem
          text={p.name}
          active={active}
          label={moment(p.creationTimestamp).fromNow()}
          onClick={() => props.onSelect(p)}
          icon={
            <Icon
              name="policy"
              color={active ? "#137CBD" : textColor}
              size={[17, 19]}
            />
          }
        />
      );
    });
  }

  return (
    <div className={container}>
      <Menu>{content}</Menu>
    </div>
  );
});
