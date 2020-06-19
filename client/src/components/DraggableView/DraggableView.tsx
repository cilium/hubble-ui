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
import { DraggableEventHandler } from "react-draggable";
import { provideWithRouter } from "../../state";
import { getMapPanelPosition } from "../App/state/selectors";
import { MapView } from "../MapView/MapView";
import { getNamespaceFromParams } from "../Routing/state/selectors";
import { DraggablePanel } from "./DraggablePanel";
import { setMapPanelPosition } from "./state/actions";

const css = require("./DraggableView.scss");

const provider = provideWithRouter({
  mapStateToProps: state => ({
    position: getMapPanelPosition(state),
    namespace: getNamespaceFromParams(state)
  }),
  mapDispatchToProps: {
    setMapPanelPosition
  }
});

export const LOCAL_STORAGE_POSITION_KEY = "advanced-view-drag-panel-position";

export const getPanelPosition = () => {
  const storedPosition = localStorage.getItem(LOCAL_STORAGE_POSITION_KEY);
  let position = 0.5;
  if (typeof storedPosition === "string") {
    if (+storedPosition >= 0 && +storedPosition <= 1) {
      position = +storedPosition;
    }
  }
  localStorage.setItem(LOCAL_STORAGE_POSITION_KEY, String(position));
  return position;
};

export const { Container: DraggableView } = provider(Props => {
  return class DraggableViewClass extends React.Component<typeof Props> {
    ref: React.RefObject<HTMLDivElement>;

    onResize = (size: number) => {
      this.props.setMapPanelPosition({ position: 1 - size / 100 });
    };

    onDragPanel: DraggableEventHandler = (event, { deltaY }) => {
      if (!this.ref.current) {
        return;
      }
      const height = this.ref.current.clientHeight - 45;
      const newPosition = this.props.position + deltaY / height;
      if (newPosition > 0.8) {
        this.props.setMapPanelPosition({
          position: 0.8
        });
      } else if (newPosition < 0.2) {
        this.props.setMapPanelPosition({
          position: 0.2
        });
      } else {
        this.props.setMapPanelPosition({
          position: newPosition
        });
      }
    };

    render() {
      this.ref = React.createRef<HTMLDivElement>();
      const { position, namespace } = this.props;

      if (!namespace) {
        return <NoNamespaceSelected />;
      }

      const tableHeight = (1 - position) * 100;
      const mapHeight = 100 - tableHeight;

      return (
        <div className={css.wrapper} ref={this.ref}>
          <div
            className={css.mapwrapper}
            style={{ height: `calc(${mapHeight}% - 19px)` }}
          >
            <MapView />
          </div>
          <DraggablePanel onDrag={this.onDragPanel} onResize={this.onResize} />
          <div
            className={css.tablewrapper}
            style={{
              top: `calc(${mapHeight}% + 19px)`,
              height: `calc(${tableHeight}% - 19px)`
            }}
          >
            {this.props.children}
          </div>
        </div>
      );
    }
  };
});

const NoNamespaceSelected = () => {
  return (
    <div className={`${css.wrapper} ${css.emptywrapper}`}>
      <img
        src={require("../assets/icons/figure-brackets-icon.svg")}
        style={{ width: "111.6px", height: "71.45px" }}
      />
      <div
        style={{
          margin: "18px 0 8px 0",
          color: "#303030",
          fontSize: "14px",
          lineHeight: "17px",
          fontWeight: 700
        }}
      >
        No namespace selected
      </div>
      <div
        style={{
          color: "#7B7B7B",
          fontSize: "12px",
          lineHeight: "18px"
        }}
      >
        No namespace is currently selected, select the one you need in the bar
        on the top
      </div>
    </div>
  );
};
