import { Button, Spinner } from '@blueprintjs/core';
import React, { memo } from 'react';
import { animated } from 'react-spring';
import { ReactEventHandlers } from 'react-use-gesture/dist/types';
import css from './styles.scss';

export interface Props {
  bindDrag: ReactEventHandlers;
}

export const DragPanel = memo<Props>(props => {
  return (
    <animated.div {...props.bindDrag} className={css.wrapper}>
      <Button small active rightIcon={<Spinner size={16} />}>
        Flows streaming
      </Button>
    </animated.div>
  );
});

DragPanel.displayName = 'DragPanel';
