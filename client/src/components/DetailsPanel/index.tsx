import { observer } from 'mobx-react';
import React, { FunctionComponent, useMemo, useRef } from 'react';

import { DragPanel, DragPanelBaseProps } from '~/components/DragPanel';
import { FlowsTable } from '~/components/FlowsTable';
import { FlowsTableSidebar } from '~/components/FlowsTable/Sidebar';

import { Flow } from '~/domain/flows';

import { usePanelResize } from './hooks';

import css from './styles.scss';

interface SidebarProps {
  onCloseSidebar?: () => void;
}

interface TableProps {
  flows: Flow[];
  flowsDiffCount?: { value: number };
  selectedFlow: Flow | null;
  onSelectFlow?: (flow: Flow | null) => void;
  tsUpdateDelay?: number;
}

interface PanelProps {
  resizable: boolean;
}

export type Props = SidebarProps & TableProps & PanelProps & DragPanelBaseProps;

export const DetailsPanelComponent = function(props: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [resizeStyles, onResize] = usePanelResize(rootRef);

  const diffCount = useMemo(() => {
    if (props.flowsDiffCount != null) return props.flowsDiffCount;

    return { value: 0 };
  }, [props.flowsDiffCount]);

  return (
    <div className={css.panel} ref={rootRef} style={resizeStyles}>
      <div className={css.dragPanel}>
        <DragPanel
          selectedVerdict={props.selectedVerdict}
          onSelectVerdict={props.onSelectVerdict}
          selectedHttpStatus={props.selectedHttpStatus}
          onSelectHttpStatus={props.onSelectHttpStatus}
          flowFilters={props.flowFilters}
          onChangeFlowFilters={props.onChangeFlowFilters}
          onResize={onResize}
        />
      </div>

      <div className={css.tableWrapper}>
        <FlowsTable
          flows={props.flows}
          flowsDiffCount={diffCount}
          selectedFlow={props.selectedFlow}
          onSelectFlow={props.onSelectFlow}
          tsUpdateDelay={props.tsUpdateDelay}
        />
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
