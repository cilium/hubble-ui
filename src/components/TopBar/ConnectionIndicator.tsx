import classnames from 'classnames';
import React from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

import { Status } from '~/domain/status';
import { TransferState } from '~/domain/interactions';
import { numberSep } from '~/domain/misc';

import css from './ConnectionIndicator.scss';

export interface Props {
  transferState: TransferState;
}

export const ConnectionIndicator = observer(function ConnectionIndicator(
  props: Props,
) {
  const transfer = props.transferState;
  const isReceiving = transfer.isReceiving;
  const isReconnecting = props.transferState.isReconnecting;
  const isStopped = props.transferState.isStopped;

  const className = classnames(css.wrapper, {
    [css.receiving]: isReceiving,
    [css.reconnecting]:
      transfer.isReconnecting ||
      transfer.isReconnectDelay ||
      transfer.isReconnectFailed,
    [css.stopped]: isStopped,
    [css.idle]: transfer.isIdle,
    [css.circleAnimated]: isReceiving || transfer.isReconnecting,
  });

  const unknownReconnectWaiting =
    transfer.isWaitingForReconnect &&
    (transfer.reconnectingInMs == null ||
      transfer.reconnectingInMs < Number.EPSILON);

  const label: React.ReactNode = computed(() => {
    if (isReconnecting) return dots('Reconnecting');
    if (transfer.isWaitingForReconnect) {
      const remaining = Math.round(transfer.reconnectingInSeconds!);

      return `Reconnecting in ${remaining}s`;
    }

    if (unknownReconnectWaiting) return dots('Waiting for reconnection');
    if (transfer.isReconnectFailed) return `Reconnection failed`;

    if (isReceiving && transfer.deploymentStatus != null) {
      return generateStatusLabel(transfer.deploymentStatus);
    }

    if (isStopped) return 'Data receiving stopped';

    return 'Idle';
  }).get();

  return (
    <div className={className}>
      <div className={css.circle} />
      <div className={css.label}>{label}</div>
    </div>
  );
});

const dots = (text: string) => {
  return (
    <>
      {text}
      <span className={css.dots}>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </>
  );
};

const generateStatusLabel = (st: Status): React.ReactNode => {
  const fps = st.flows.perSecond;
  const [factor, letter] =
    fps < 1e3 ? [1, ''] : fps < 1e6 ? [1e3, 'K'] : [1e6, 'M'];

  const flowsRate = numberSep(`${(fps / factor).toFixed(1)}${letter}`);
  const flowsLabel = `${flowsRate} flows/s`;
  const flowsTitle = `${numberSep(fps.toFixed(1))} flows/s`;

  const nTotalNodes = st.nodes.length;
  const nAvailable = st.nodes.filter(n => n.isAvailable).length;
  const nodesLabel = `${nAvailable}/${nTotalNodes} nodes`;

  return (
    <>
      <span className={css.flowsLabel} title={flowsTitle}>
        {flowsLabel}
      </span>
      <span className={css.dotDivider}>•</span>
      <span className={css.nodesLabel}>{nodesLabel}</span>
    </>
  );
};
