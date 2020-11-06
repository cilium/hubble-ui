import classnames from 'classnames';
import React, { memo } from 'react';

import { Status } from '~/domain/status';

import css from './ConnectionIndicator.scss';

export enum ConnectionState {
  Receiving = 'receiving',
  Reconnecting = 'reconnecting',
  Stopped = 'stopped',
  Idle = 'idle',
}

export interface Props {
  state: ConnectionState;
  status?: Status;
}

export const ConnectionIndicator = memo<Props>(function ConnectionIndicator(
  props,
) {
  const isReceiving = props.state === ConnectionState.Receiving;
  const isReconnecting = props.state === ConnectionState.Reconnecting;

  const className = classnames(css.wrapper, {
    [css.receiving]: isReceiving,
    [css.reconnecting]: isReconnecting,
    [css.stopped]: props.state === ConnectionState.Stopped,
    [css.idle]: props.state === ConnectionState.Idle,
    [css.circleAnimated]: [
      ConnectionState.Receiving,
      ConnectionState.Reconnecting,
    ].includes(props.state),
  });

  let label: React.ReactNode = (
    <>
      {isReceiving ? 'Receiving data' : 'Reconnecting'}
      <span className={css.dots}>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </>
  );

  if (isReceiving && props.status != null) {
    label = generateStatusLabel(props.status);
  } else if (props.state === ConnectionState.Stopped) {
    label = 'Data receiving stopped';
  } else if (props.state === ConnectionState.Idle) {
    label = 'Idle';
  }

  return (
    <div className={className}>
      <div className={css.circle} />
      <div className={css.label}>{label}</div>
    </div>
  );
});

const generateStatusLabel = (st: Status): React.ReactNode => {
  const fps = st.flows.perSecond;
  const flowsRate =
    fps < 100 ? `${Math.round(fps)}` : `${(fps / 1000).toFixed(1)}K`;

  const flowsLabel = `${flowsRate} flows/s`;

  const nTotalNodes = st.nodes.length;
  const nAvailable = st.nodes.filter(n => n.isAvailable).length;
  const nodesLabel = `${nAvailable}/${nTotalNodes} nodes`;

  return (
    <>
      <span className={css.flowsLabel}>{flowsLabel}</span>
      <span className={css.dotDivider}>•</span>
      <span className={css.nodesLabel}>{nodesLabel}</span>
    </>
  );
};
