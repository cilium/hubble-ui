import React, { memo } from 'react';
import { animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';

import {
  FlowsTableColumnsSelector,
  Props as FlowsTableColumnsSelectorProps,
} from '~/components/FlowsTable/ColumnsSelector';

import css from './styles.scss';

export interface Props {
  flowsTableVisibleColumns: FlowsTableColumnsSelectorProps['visibleColumns'];
  onToggleFlowsTableColumn: FlowsTableColumnsSelectorProps['onToggleColumn'];
  onResize?: (dy: number) => void;
  onStreamStop?: () => void;
}

export const Component = function DragPanelComponent(props: Props) {
  const bind = useDrag(e => {
    const dy = (e as any).delta[1];
    props.onResize && props.onResize(dy);
  });

  return (
    <animated.div {...bind()} className={css.dragPanel}>
      <div className={css.left}>
        <FlowsTableColumnsSelector
          visibleColumns={props.flowsTableVisibleColumns}
          onToggleColumn={props.onToggleFlowsTableColumn}
        />
      </div>
      <div className={css.center} />
      <div className={css.right} />
    </animated.div>
  );
};

export const DragPanel = memo<Props>(Component);
DragPanel.displayName = 'DragPanelMemoized';
