import React, { useMemo, memo } from 'react';
import { Button, Spinner } from '@blueprintjs/core';
import { animated } from 'react-spring';
import { ReactEventHandlers } from 'react-use-gesture/dist/types';
import { useDrag } from 'react-use-gesture';

import css from './styles.scss';

export interface Props {
  onResize?: (dy: number) => void;
}

export const Component = function DragPanelComponent(props: Props) {
  // XXX: this thing cannot be used inside useMemo ???
  const bind = useDrag(e => {
    const dy = e.delta[1];

    props.onResize && props.onResize(dy);
  });

  return (
    <animated.div {...bind()} className={css.dragPanel}>
      <Button small active rightIcon={<Spinner size={16} />}>
        Flows streaming
      </Button>
    </animated.div>
  );
};

export const DragPanel = memo<Props>(Component);
DragPanel.displayName = 'DragPanelMemoized';
