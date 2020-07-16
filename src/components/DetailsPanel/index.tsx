import { observer } from 'mobx-react';
import React, { FunctionComponent, useCallback, useEffect } from 'react';

import { DragPanel } from '~/components/DragPanel';
import {
  FlowsTable,
  Props as FlowsTableProps,
  OnFlowsDiffCount,
  TickerEvents,
  DEFAULT_TS_UPDATE_DELAY,
} from '~/components/FlowsTable';
import { FlowsTableSidebar } from '~/components/FlowsTable/Sidebar';
import { useFlowsTableColumns } from '~/components/FlowsTable/hooks/useColumns';
import { LoadingOverlay } from '~/components/Misc/LoadingOverlay';

import { usePanelResize, ResizeProps } from './hooks/usePanelResize';

import css from './styles.scss';

export { DEFAULT_TS_UPDATE_DELAY, TickerEvents, OnFlowsDiffCount };

interface SidebarProps {
  onCloseSidebar?: () => void;
}

interface PanelProps {
  isStreaming: boolean;
  onPanelResize?: (resizeProps: ResizeProps) => void;
  onStreamStop?: () => void;
}

type TableProps = Omit<FlowsTableProps, 'isVisibleColumn'>;

export type Props = SidebarProps & TableProps & PanelProps;

export const DetailsPanelComponent = function (props: Props) {
  const panelResize = usePanelResize();
  const flowsTableColumns = useFlowsTableColumns();

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
          isVisibleFlowsTableColumn={flowsTableColumns.isVisibleColumn}
          toggleFlowsTableColumn={flowsTableColumns.toggleColumn}
          onResize={panelResize.onResize}
          onStreamStop={onStreamStop}
        />
      </div>

      <div className={css.tableWrapper}>
        {tableLoaded ? (
          <FlowsTable
            flows={props.flows}
            isVisibleColumn={flowsTableColumns.isVisibleColumn}
            selectedFlow={props.selectedFlow}
            dataFilters={props.dataFilters}
            onSelectFlow={props.onSelectFlow}
            onSelectFilters={props.onSelectFilters}
            onFlowsDiffCount={props.onFlowsDiffCount}
            ticker={props.ticker}
          />
        ) : (
          <LoadingOverlay text="Waiting for table data…" />
        )}
      </div>

      {props.selectedFlow && (
        <FlowsTableSidebar
          flow={props.selectedFlow}
          dataFilters={props.dataFilters}
          onClose={props.onCloseSidebar}
          onSelectFilters={props.onSelectFilters}
        />
      )}
    </div>
  );
};

export const DetailsPanel: FunctionComponent<Props> = observer(
  DetailsPanelComponent,
);

export { ResizeProps };
