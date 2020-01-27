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
import * as ReactDOM from "react-dom";
import { domNodes } from "../../dom-nodes";
import ScreenDimensionsProvider from "../App/ScreenDimensionsProvider";
import { ModalContainer } from "../Modal/Modal";
import { NotificationBannerContainer } from "../Notifications/NotificationBanner";
import "./FullScreen.scss";

type FullScreenProps = {
  children?: any;
  mod?: string;
};

export class FullScreen extends React.Component<FullScreenProps, {}> {
  render() {
    const { children, mod } = this.props;
    return (
      <div className={"FullScreen " + (mod ? `FullScreen-${mod}` : "")}>
        <ScreenDimensionsProvider />
        {ReactDOM.createPortal(
          <NotificationBannerContainer />,
          domNodes.notificationsRoot
        )}
        {ReactDOM.createPortal(<ModalContainer />, domNodes.modalsRoot)}
        {children}
      </div>
    );
  }
}
