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
import * as classnames from "classnames";
import * as React from "react";
import { provide } from "../../state";
import { NamespacesDropdownSelector } from "../Common/NamespacesDropdownSelector";
import { DiscoveryDateTimePicker } from "../DiscoveryView/DiscoveryDateTimePicker";
import { DiscoveryInfo } from "./DiscoveryInfo";
import { MapFiltersPopover } from "./MapFiltersPopover";
import { TopBarEndpointInfo } from "./TopBarEndpointInfo";

const css = require("./TabsBar.scss");

const provider = provide({
  mapDispatchToProps: {}
});

export const { Container: TabsBar } = provider(Props => {
  return class TabsBarClass extends React.Component<typeof Props> {
    render() {
      return (
        <div
          className={classnames(css.wrapper, {
            [css.hubble]: true
          })}
        >
          <div
            className={classnames(css.topSection, {
              [css.hubble]: true
            })}
          >
            <div className={css.left}>
              <NamespacesDropdownSelector autoSelectFirstNamespace={false} />
              <TopBarEndpointInfo />
              {/* <div className={css.minsAfter}>
                <DiscoveryDateTimePicker />
              </div> */}
              <MapFiltersPopover />
            </div>
            <div className={css.right}>
              <DiscoveryInfo />
            </div>
          </div>
        </div>
      );
    }
  };
});
