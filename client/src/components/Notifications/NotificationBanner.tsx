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
import { Collapse } from "react-collapse";
import { provide } from "../../state";
import { NotificationTypeMap } from "./state/types";
import { hideNotification } from "./state/actions";
import { getVisible, getLastNotification } from "./state/selectors";

const css = require("./NotificationBanner.scss");

const provider = provide({
  mapStateToProps: state => ({
    ...getLastNotification(state),
    visible: getVisible(state)
  }),
  mapDispatchToProps: {
    hideNotification
  }
});

export const {
  Component: NotificationBannerComponent,
  Container: NotificationBannerContainer
} = provider(
  IProps =>
    class extends React.Component<typeof IProps, {}> {
      onClick = (event: React.MouseEvent<any>) => {
        this.props.hideNotification({
          notificationId: this.props.id
        });
      };

      render() {
        const { visible, text, type } = this.props;
        const cssType = css[NotificationTypeMap[type]];
        return (
          <div className={`${css.wrapper}`} onClick={this.onClick}>
            <Collapse
              forceInitialAnimation
              isOpened={visible && text && text.trim().length > 0}
            >
              <div className={`${css.background} ${cssType}`}>
                <div className={css.close}>×</div>
                <div className={css.text}>{text}</div>
              </div>
            </Collapse>
          </div>
        );
      }
    }
);
