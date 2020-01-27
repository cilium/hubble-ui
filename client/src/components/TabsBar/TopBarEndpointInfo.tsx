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
import { Tag, Text, Intent } from "@blueprintjs/core";
import { provide } from "../../state";
import { pushAppUrl } from "../Routing/state/actions";
import { getCurrentEndpoint } from "../App/state/selectors";

const provider = provide({
  mapStateToProps: state => ({
    currentEndpoint: getCurrentEndpoint(state)
  }),
  mapDispatchToProps: {
    pushAppUrl: pushAppUrl
  }
});

const tag = css`
  display: block;
  overflow: hidden;
  max-width: 480px !important;
  min-height: 24px;
  height: 24px;
  margin-left: 10px;
  margin-right: 20px;
`;

export const { Container: TopBarEndpointInfo } = provider(() => props => {
  const { currentEndpoint } = props;
  return currentEndpoint ? (
    <Tag
      minimal
      intent={Intent.PRIMARY}
      onRemove={() =>
        props.pushAppUrl({
          endpointsQuery: null
        })
      }
      className={tag}
    >
      <Text ellipsize>
        Service: <b>{currentEndpoint.name}</b>
      </Text>
    </Tag>
  ) : (
    <Tag minimal intent={Intent.NONE} className={tag}>
      No service selected
    </Tag>
  );
});
