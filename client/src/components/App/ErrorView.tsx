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
import { provide } from "../../state";

const css = require("./ErrorView.scss");

const provider = provide({
  mapStateToProps: state => ({
    isDataErrorAndUnavailable: false
  })
});

export const { Container: ErrorView } = provider(Props => {
  type Props = typeof Props;
  return class ErrorViewClass extends React.Component<Props> {
    reload = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      window.location.reload();
    };
    render() {
      const { isDataErrorAndUnavailable } = this.props;
      if (!isDataErrorAndUnavailable) {
        return null;
      }
      return (
        <div className={css.wrapper}>
          <img
            src={require("../assets/icons/broken-icon.svg")}
            className={css.icon}
          />
          <div className={css.title}>Ooops! Something went wrong</div>
          <div className={css.subtitle}>
            Try to{" "}
            <a href="/" onClick={this.reload}>
              reload
            </a>{" "}
            page
          </div>
        </div>
      );
    }
  };
});
