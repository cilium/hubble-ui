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

import {
  FlowsTableSidebar,
  Props as SidebarProps,
} from '~/components/FlowsTable/Sidebar';

import { LoadingOverlay } from '~/components/Misc/LoadingOverlay';

import { usePanelResize, ResizeProps } from './hooks/usePanelResize';

import css from './styles.scss';

export { DEFAULT_TS_UPDATE_DELAY, TickerEvents, OnFlowsDiffCount };

interface PanelProps {
  namespace: string;
  isStreaming: boolean;
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

export const DetailsPanelComponent = function (props: Props) {
  const panelResize = usePanelResize();
  // const flowsTableColumns = useFlowsTableColumns();

  const onStreamStop = useCallback(() => {
    props.onStreamStop?.();
  }, [props.onStreamStop]);

  useEffect(() => {
    props.onPanelResize?.(panelResize.props);
  }, [props.onPanelResize, panelResize.props]);

  const tableLoaded = props.flows.length > 0 && props.isStreaming;

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
            ticker={props.ticker}
          />
        ) : (
          <LoadingOverlay
            text={
              props.flowsWaitTimeout
                ? `No flows found for ${props.namespace} namespace. Will continue to monitor for new flows…`
                : 'Waiting for flows to show flows table…'
            }
            spinnerIntent={props.flowsWaitTimeout ? 'none' : 'success'}
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
};

export const DetailsPanel: FunctionComponent<Props> = observer(
  DetailsPanelComponent,
);

export { ResizeProps };
