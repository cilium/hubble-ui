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
import { bindActionCreators, compose, connect } from "../../state";
import { updateScreenDimensions } from "./state/actions";
import { getScreenDimensions } from "./state/selectors";

export class ScreenDimensionsProvider extends React.Component<any, any> {
  timeout: any;

  onResize = () => {
    clearTimeout(this.timeout);
    const { screenDimensions, updateScreenDimensions } = this.props;
    // TODO: throttling
    const { offsetTop = 0 } = this.props;
    const screenWidth = document.body.clientWidth;
    const screenHeight = document.body.clientHeight - offsetTop;
    if (
      screenWidth != screenDimensions.width ||
      screenHeight !== screenDimensions.height
    ) {
      updateScreenDimensions({ width: screenWidth, height: screenHeight });
    }
    this.timeout = setTimeout(this.onResize, 25);
  };

  componentWillMount() {
    this.timeout = setTimeout(this.onResize, 25);
    this.onResize();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    return null;
  }
}

const mapStateToProps = (state: any) => {
  return {
    screenDimensions: getScreenDimensions(state)
  };
};

export default compose(
  connect(mapStateToProps, dispatch =>
    bindActionCreators({ updateScreenDimensions }, dispatch)
  )
)(ScreenDimensionsProvider);
