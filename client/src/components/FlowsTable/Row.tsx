import React, { memo, useCallback } from 'react';
import classnames from 'classnames';

import { useFlowTimestamp } from './hooks/useFlowTimestamp';
import { Flow } from '~/domain/flows';

import css from './styles.scss';

export interface RowProps {
  flow: Flow;
  selected: boolean;
  onSelect: (flow: Flow) => void;
  tsUpdateDelay: number;
}

export const Row = memo<RowProps>(function FlowsTableRow(props) {
  const { flow } = props;
  const ts = flow.millisecondsTimestamp;

  const onClick = useCallback(() => props.onSelect(flow), []);
  const timestamp = useFlowTimestamp(ts, props.tsUpdateDelay);

  const sourceAppName = flow.sourceAppName ?? 'No app name';
  const destinationAppName = flow.destinationAppName ?? 'No app name';

  const sourceNamespace = flow.sourceNamespace ? (
    <i>{flow.sourceNamespace}</i>
  ) : (
    ''
  );
  const destinationNamespace = flow.destinationNamespace ? (
    <i>{flow.destinationNamespace}</i>
  ) : (
    ''
  );

  // prettier-ignore
  const sourceTitle = <>{sourceAppName} {sourceNamespace}</>;
  // prettier-ignore
  const destinationTitle = <>{destinationAppName} {destinationNamespace}</>;

  const className = classnames({ [css.selected]: props.selected });

  return (
    <tr className={className} onClick={onClick}>
      <td>{sourceTitle}</td>
      <td>{destinationTitle}</td>
      <td>{flow.destinationPort}</td>
      <td>{flow.verdictLabel}</td>
      <td title={flow.isoTimestamp || undefined}>{timestamp}</td>
    </tr>
  );
});
