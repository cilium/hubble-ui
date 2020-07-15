import { Spinner, Intent } from '@blueprintjs/core';
import React, { memo } from 'react';

import css from './LoadingOverlay.scss';

export interface Props {
  text: string;
  height?: string | number;
  spinnerSize?: number;
  spinnerIntent?: Intent;
}

export const LoadingOverlay = memo<Props>(function LoadingOverlay(props) {
  const { height = '100%' } = props;
  const style = { height };

  return (
    <div className={css.wrapper} style={style}>
      <Spinner
        size={props.spinnerSize ?? 68}
        intent={props.spinnerIntent ?? 'primary'}
      />
      <div className={css.label}>{props.text}</div>
    </div>
  );
});
