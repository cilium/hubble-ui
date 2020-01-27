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
import { Icon } from "@blueprintjs/core";
import * as React from "react";
import { provide } from "src/state";

const css = require("./UserMenu.scss");

type Props = {
  className?: string;
};

const provider = provide({
  mapStateToProps: (state, ownProps: Props) => ({})
});

export const { Container: UserMenu } = provider(Props => {
  type Props = typeof Props;
  return class UserMenuComponent extends React.Component<Props> {
    render() {
      return this.renderAccount();
    }

    renderAccount() {
      return (
        <div className={css.userMenuWrapper}>
          <div className={css.userMenuEmail}>
            <Icon className={css.userMenuIcon} icon="user" iconSize={12} />{" "}
            <Icon
              className={css.userMenuChevron}
              icon="chevron-down"
              iconSize={12}
            />
          </div>
        </div>
      );
    }
  };
});
