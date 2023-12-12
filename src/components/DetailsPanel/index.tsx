import { observer } from 'mobx-react';
import React, { FunctionComponent, useCallback, useEffect } from 'react';

import { DragPanel } from '~/components/DragPanel';
import {
  FlowsTable,
  Props as FlowsTableProps,
  OnFlowsDiffCount,
  TickerEvents,
  DEFAULT_TS_UPDATE_DELAY,
  Column,
} from '~/components/FlowsTable';

import { FlowsTableSidebar, Props as SidebarProps } from '~/components/FlowsTable/Sidebar';
import {
  LoadingOverlay,
  getProps as getLoadingOverlayProps,
} from '~/components/Misc/LoadingOverlay';

import { DataMode, TransferState } from '~/domain/interactions';
import { usePanelResize, ResizeProps } from './hooks/usePanelResize';

import css from './styles.scss';

export { DEFAULT_TS_UPDATE_DELAY, TickerEvents, OnFlowsDiffCount };

interface PanelProps {
  namespace: string | null;
  transferState: TransferState;
  flowsWaitTimeout: boolean;
  flowsTableVisibleColumns: Set<Column>;
  onPanelResize?: (resizeProps: ResizeProps) => void;
  onStreamStop?: () => void;
  onFlowsTableColumnToggle?: (_: Column) => void;
}

type TableProps = Omit<FlowsTableProps, 'visibleColumns'>;

export type Props = PanelProps &
  TableProps & {
    onCloseSidebar: SidebarProps['onClose'];
    onSidebarVerdictClick: SidebarProps['onVerdictClick'];
    onSidebarTCPFlagClick: SidebarProps['onTcpFlagClick'];
    onSidebarLabelClick: SidebarProps['onLabelClick'];
    onSidebarPodClick: SidebarProps['onPodClick'];
    onSidebarIdentityClick: SidebarProps['onIdentityClick'];
    onSidebarIpClick: SidebarProps['onIpClick'];
    onSidebarDnsClick: SidebarProps['onDnsClick'];
    filters: SidebarProps['filters'];
  };

export const DetailsPanel = observer(function DetailsPanel(props: Props) {
  const panelResize = usePanelResize();

  const onStreamStop = useCallback(() => {
    props.onStreamStop?.();
  }, [props.onStreamStop]);

  useEffect(() => {
    props.onPanelResize?.(panelResize.props);
  }, [props.onPanelResize, panelResize.props]);

  const dataMode = props.transferState.dataMode;
  const tableLoaded = props.flows.length > 0 && dataMode === DataMode.CiliumStreaming;
  const loadingOverlay = getLoadingOverlayProps(props.flowsWaitTimeout, dataMode, props.namespace);

  return (
    <div className={css.panel} ref={panelResize.ref} style={panelResize.style}>
      <div className={css.dragPanel}>
        <DragPanel
          flowsTableVisibleColumns={props.flowsTableVisibleColumns}
          onToggleFlowsTableColumn={props.onFlowsTableColumnToggle}
          onResize={panelResize.onResize}
          onStreamStop={onStreamStop}
        />
      </div>

      <div className={css.tableWrapper}>
        {tableLoaded ? (
          <FlowsTable
            flows={props.flows}
            visibleColumns={props.flowsTableVisibleColumns}
            selectedFlow={props.selectedFlow}
            onSelectFlow={props.onSelectFlow}
            onFlowsDiffCount={props.onFlowsDiffCount}
          />
        ) : (
          <LoadingOverlay
            text={loadingOverlay.text.flowsTable}
            isSpinnerHidden={loadingOverlay.isSpinnerHidden}
            spinnerIntent={loadingOverlay.spinnerIntent}
          />
        )}
      </div>

      {props.selectedFlow && (
        <FlowsTableSidebar
          flow={props.selectedFlow}
          filters={props.filters}
          onClose={props.onCloseSidebar}
          onVerdictClick={props.onSidebarVerdictClick}
          onTcpFlagClick={props.onSidebarTCPFlagClick}
          onLabelClick={props.onSidebarLabelClick}
          onPodClick={props.onSidebarPodClick}
          onIdentityClick={props.onSidebarIdentityClick}
          onIpClick={props.onSidebarIpClick}
          onDnsClick={props.onSidebarDnsClick}
        />
      )}
    </div>
  );
});

export { ResizeProps };
