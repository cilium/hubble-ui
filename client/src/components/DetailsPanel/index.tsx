import { RouteComponentProps, Router, useNavigate } from '@reach/router';
import { observer } from 'mobx-react';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';

import { DragPanel } from '~/components/DragPanel';
import { FlowsTable } from '~/components/FlowsTable';
import { FlowsTableSidebar } from '~/components/FlowsTable/Sidebar';
import { usePanelResize } from './hooks';

import { Flow } from '~/domain/flows';
import { XY } from '~/domain/geometry';

import css from './styles.scss';

interface SidebarProps {
  onSidebarClose?: () => void;
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

export type Props = SidebarProps & TableProps & PanelProps;

export const DetailsPanelComponent = function(props: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [resizeStyles, onResize] = usePanelResize(rootRef, 0.66);

  const diffCount = useMemo(() => {
    if (props.flowsDiffCount != null) return props.flowsDiffCount;

    return { value: 0 };
  }, [props.flowsDiffCount]);

  return (
    <div className={css.panel} ref={rootRef} style={resizeStyles}>
      <div className={css.dragPanel}>
        <DragPanel onResize={onResize} />
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
          onClose={props.onSidebarClose}
        />
      )}
    </div>
  );
};

export const DetailsPanel: FunctionComponent<Props> = observer(
  DetailsPanelComponent,
);
