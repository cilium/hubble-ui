import { observer } from 'mobx-react';
import React, {
  FunctionComponent,
  useMemo,
  useCallback,
  useEffect,
} from 'react';

import { DragPanel } from '~/components/DragPanel';
import { FlowsTable, Props as FlowsTableProps } from '~/components/FlowsTable';
import { FlowsTableSidebar } from '~/components/FlowsTable/Sidebar';
import { useFlowsTableColumns } from '~/components/FlowsTable/hooks/useColumns';

import css from './styles.scss';
import { LoadingOverlay } from '../Misc/LoadingOverlay';
import { usePanelResize, ResizeProps } from './hooks/usePanelResize';

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

  const diffCount = useMemo(() => {
    if (props.flowsDiffCount != null) return props.flowsDiffCount;

    return { value: 0 };
  }, [props.flowsDiffCount]);

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
            flowsDiffCount={diffCount}
            isVisibleColumn={flowsTableColumns.isVisibleColumn}
            selectedFlow={props.selectedFlow}
            onSelectFlow={props.onSelectFlow}
            tsUpdateDelay={props.tsUpdateDelay}
          />
        ) : (
          <LoadingOverlay text="Waiting for table data…" />
        )}
      </div>

      {props.selectedFlow && (
        <FlowsTableSidebar
          flow={props.selectedFlow}
          onClose={props.onCloseSidebar}
        />
      )}
    </div>
  );
};

export const DetailsPanel: FunctionComponent<Props> = observer(
  DetailsPanelComponent,
);

export { ResizeProps };
