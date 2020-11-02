import classnames from 'classnames';
import React, { memo } from 'react';

import css from './ConnectionIndicator.scss';

export enum ConnectionState {
  Receiving = 'receiving',
  Reconnecting = 'reconnecting',
  Stopped = 'stopped',
}

export interface Props {
  state: ConnectionState;
}

export const ConnectionIndicator = memo<Props>(function ConnectionIndicator(
  props,
) {
  const className = classnames(css.wrapper, {
    [css.active]: props.state === ConnectionState.Receiving,
    [css.inactive]: props.state !== ConnectionState.Receiving,
  });

  let label: React.ReactNode = (
    <>
      Receiving data
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </>
  );

  if (props.state === ConnectionState.Reconnecting) {
    label = 'Reconnecting';
  } else if (props.state === ConnectionState.Stopped) {
    label = 'Data receiving stopped';
  }

  return (
    <div className={className}>
      <div className={css.circle} />
      <div className={css.label}>{label}</div>
    </div>
  );
});
