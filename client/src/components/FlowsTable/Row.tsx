import React, { memo, useCallback } from 'react';
import classnames from 'classnames';

import { useWhenOccured } from './hooks/useWhenOccured';
import { Flow } from '~/domain/flows';
import { CommonProps } from './general';

import css from './styles.scss';

export interface RowProps extends CommonProps {
  flow: Flow;
  selected: boolean;
  onSelect: (flow: Flow) => void;
  tsUpdateDelay: number;
}

export const Row = memo<RowProps>(function FlowsTableRow(props) {
  const { flow, isVisibleColumn } = props;
  const ts = flow.millisecondsTimestamp;

  const onClick = useCallback(() => props.onSelect(flow), []);
  const timestamp = useWhenOccured(ts, props.tsUpdateDelay);

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
      {isVisibleColumn('SrcPod') && (
        <td>
          {props.flow.sourcePodName || (
            <span className={css.emptyValue}>—</span>
          )}
        </td>
      )}
      {isVisibleColumn('SrcIp') && <td>{props.flow.sourceIp}</td>}
      {isVisibleColumn('SrcService') && <td>{sourceTitle}</td>}
      {isVisibleColumn('DstPod') && (
        <td>
          {props.flow.destinationPodName || (
            <span className={css.emptyValue}>—</span>
          )}
        </td>
      )}
      {isVisibleColumn('DstIp') && <td>{props.flow.destinationIp}</td>}
      {isVisibleColumn('DstService') && <td>{destinationTitle}</td>}
      {isVisibleColumn('DstPort') && <td>{flow.destinationPort}</td>}
      {isVisibleColumn('Verdict') && <td>{flow.verdictLabel}</td>}
      {isVisibleColumn('Timestamp') && (
        <td title={flow.isoTimestamp || undefined}>{timestamp}</td>
      )}
    </tr>
  );
});
