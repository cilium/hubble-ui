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
import Draggable, { DraggableEventHandler } from "react-draggable";
import { provide } from "../../state";
import { getMapPanelPosition } from "../App/state/selectors";
import { toggleFlowsTableMode } from "../Flows/state/actions";
import { getFlowsTableMode, getFlowsToPolicy } from "../Flows/state/selectors";
import { HttpStatusCodeFilter } from "../Hubble/HttpStatusCodeFilter";
import { getAppAdvancedViewTypeFromParams } from "../Routing/state/selectors";
import { AppAdvancedViewType } from "../Routing/state/types";
import { ColumnsIcon } from "../TroubleshootingView/ColumnsDropdown";
import { FlowsFilter } from "../TroubleshootingView/FlowsFilter";
import { ForwardingStatusFilter } from "../TroubleshootingView/ForwardingStatusFilter";
import { ModeTabs } from "./ModeTabs";
import { PanelSizeIcon } from "./PanelSizeIcon";

interface OwnProps {
  readonly onResize: (size: number) => void;
  readonly onDrag: DraggableEventHandler;
}

const provider = provide({
  mapStateToProps: (state, ownProps: OwnProps) => ({
    appAdvancedViewType: getAppAdvancedViewTypeFromParams(state),
    position: getMapPanelPosition(state),
    flowsTableMode: getFlowsTableMode(state),
    hasSelectedFlowsToPolicy: Object.keys(getFlowsToPolicy(state)).length > 0
  }),
  mapDispatchToProps: {
    toggleFlowsTableMode: toggleFlowsTableMode
  }
});

const css = require("./DraggablePanel.scss");

export const { Container: DraggablePanel } = provider(Props => {
  type Props = typeof Props;
  return class DraggablePanelClass extends React.Component<Props> {
    onCreatePolicyButtonClick = () => {
      this.setState({ isCreatePolicyDialogOpen: true });
    };

    onEditFlowsButtonClick = () => {
      this.props.toggleFlowsTableMode();
    };

    render() {
      const isFlowsTab =
        this.props.appAdvancedViewType === AppAdvancedViewType.FLOWS;

      return (
        <div className={css.wrapper}>
          <Draggable
            axis="y"
            position={{ x: 0, y: this.props.position }}
            defaultClassName={css.drag}
            defaultClassNameDragging={css.dragActive}
            onDrag={this.props.onDrag}
          >
            <div className={css.dragStub} />
          </Draggable>
          <div className={css.inner}>
            <div className={css.leftButtons}>
              {isFlowsTab && <FlowsFilter />}
            </div>
            <div className={css.tabs}>
              <ModeTabs />
              {isFlowsTab && (
                <div className={css.filters}>
                  <ForwardingStatusFilter targetClassName={css.actionButton} />
                  <HttpStatusCodeFilter targetClassName={css.actionButton} />
                </div>
              )}
            </div>
            <div className={css.rightButtons}>
              {isFlowsTab && <ColumnsIcon targetClassName={css.actionButton} />}
              <PanelSizeIcon size={20} onClick={this.props.onResize} />
              <PanelSizeIcon size={50} onClick={this.props.onResize} />
              <PanelSizeIcon size={80} onClick={this.props.onResize} />
            </div>
          </div>
        </div>
      );
    }
  };
});
