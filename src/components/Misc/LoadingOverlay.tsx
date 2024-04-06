import { Spinner, Intent } from '@blueprintjs/core';
import React, { memo } from 'react';

import css from './LoadingOverlay.scss';
import { DataMode } from '~/domain/interactions';

export interface Props {
  text: string;
  height?: string | number;
  spinnerSize?: number;
  spinnerIntent?: Intent;
  isSpinnerHidden?: boolean;
}

export const LoadingOverlay = memo<Props>(function LoadingOverlay(props) {
  const { height = '100%' } = props;
  const style = { height };

  return (
    <div className={css.wrapper} style={style}>
      {!props.isSpinnerHidden && (
        <Spinner size={props.spinnerSize ?? 68} intent={props.spinnerIntent ?? 'primary'} />
      )}
      <div className={css.label}>{props.text}</div>
    </div>
  );
});

export interface GetProps {
  text: {
    map: string;
    flowsTable: string;
  };

  isSpinnerHidden: boolean;
  spinnerIntent: Intent;
}

export const getProps = (
  flowsWaitTimeout: boolean,
  dataMode: DataMode,
  namespace?: string | null,
): GetProps => {
  const spinnerIntent = flowsWaitTimeout ? Intent.NONE : Intent.SUCCESS;
  namespace = namespace ?? 'this';

  let flowsTable = 'No flows found for specified time range.';
  if (dataMode === DataMode.CiliumStreaming) {
    flowsTable = flowsWaitTimeout
      ? `No flows found for ${namespace} namespace. Will continue to monitor for new flows…`
      : 'Waiting for flows to show flows table…';
  } else if (dataMode === DataMode.Disabled) {
    flowsTable = 'Data fetching is disabled';
  }

  let map = 'No data found to render a service map';
  if (dataMode === DataMode.Disabled) {
    map = 'Data fetching is disabled';
  }

  const text = { flowsTable, map };
  const isSpinnerHidden = dataMode !== DataMode.CiliumStreaming;

  return { text, isSpinnerHidden, spinnerIntent };
};
