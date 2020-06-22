import classnames from 'classnames';
import React, { memo } from 'react';

import css from './StreamingIndicator.scss';

export interface Props {
  isStreaming: boolean;
}

export const StreamingIndicator = memo<Props>(function StreamingIndicator(
  props,
) {
  const className = classnames(css.wrapper, {
    [css.active]: props.isStreaming,
    [css.inactive]: !props.isStreaming,
  });

  const label = props.isStreaming ? (
    <>
      Receiving data
      <span>.</span>
      <span>.</span>
      <span>.</span>
    </>
  ) : (
    'Data receiving stopped'
  );

  return (
    <div className={className}>
      <div className={css.circle} />
      <div className={css.label}>{label}</div>
    </div>
  );
});
