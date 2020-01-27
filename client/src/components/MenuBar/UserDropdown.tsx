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
import { IMenuItemProps, Menu, MenuItem } from "@blueprintjs/core";
import * as classnames from "classnames";
import * as React from "react";
import { provide } from "../../state";

const css = require("./UserDropdown.scss");

const userDropdownProvider = provide({
  mapStateToProps: state => ({})
});

export const { Container: UserDropdown } = userDropdownProvider(Props => {
  type Props = typeof Props;
  interface State {
    isAddOrgDialogOpen: boolean;
    isMembersDialogOpen: boolean;
    isApiTokensDialogOpen: boolean;
    isListIntegrationsDialogOpen: boolean;
    isAddIntegrationDialogOpen: boolean;
  }
  return class UserDropdownClass extends React.PureComponent<Props, State> {
    state: State = {
      isAddOrgDialogOpen: false,
      isMembersDialogOpen: false,
      isApiTokensDialogOpen: false,
      isListIntegrationsDialogOpen: false,
      isAddIntegrationDialogOpen: false
    };
    render() {
      return <Menu></Menu>;
    }
  };
});

const CustomMenuItem: React.SFC<IMenuItemProps> = ({
  active,
  shouldDismissPopover,
  ...rest
}) => (
  <MenuItem
    {...rest}
    multiline
    shouldDismissPopover={active ? false : shouldDismissPopover}
    textClassName={css.itemText}
    className={classnames(css.menuItem, { [css.active]: active })}
  />
);
