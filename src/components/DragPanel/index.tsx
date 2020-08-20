import React, { memo } from 'react';
import { animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';

import { FlowsTableColumnsSelector } from '~/components/FlowsTable/ColumnsSelector';
import { FlowsTableColumnKey } from '~/components/FlowsTable/general';

import css from './styles.scss';

export interface Props {
  isVisibleFlowsTableColumn: (column: FlowsTableColumnKey) => boolean;
  toggleFlowsTableColumn: (column: FlowsTableColumnKey) => void;
  onResize?: (dy: number) => void;
  onStreamStop?: () => void;
}

export const Component = function DragPanelComponent(props: Props) {
  const bind = useDrag(e => {
    const dy = e.delta[1];
    props.onResize && props.onResize(dy);
  });

  return (
    <animated.div {...bind()} className={css.dragPanel}>
      <div className={css.left}>
        <FlowsTableColumnsSelector
          isVisibleColumn={props.isVisibleFlowsTableColumn}
          toggleColumn={props.toggleFlowsTableColumn}
        />
      </div>
      <div className={css.center} />
      <div className={css.right} />
    </animated.div>
  );
};

export const DragPanel = memo<Props>(Component);
DragPanel.displayName = 'DragPanelMemoized';
