import classnames from 'classnames';
import React, { memo } from 'react';

import { Flow, Verdict } from '~/domain/flows';
import { Ticker } from '~/utils/ticker';

import { FlowsTableColumn, TickerEvents } from './general';
import { useWhenOccured } from './hooks/useWhenOccured';

import css from './styles.scss';

export interface CellProps {
  flow: Flow;
  kind: FlowsTableColumn;
  ticker?: Ticker<TickerEvents>;
}

export const Cell = memo<CellProps>(function FlowsTableCell(props) {
  switch (props.kind) {
    case FlowsTableColumn.SrcPod: {
      return (
        <div className={css.cell}>
          {props.flow.sourcePodName || (
            <span className={css.emptyValue}>—</span>
          )}
        </div>
      );
    }
    case FlowsTableColumn.SrcIp: {
      return <div className={css.cell}>{props.flow.sourceIp}</div>;
    }
    case FlowsTableColumn.SrcService: {
      const appName = props.flow.sourceAppName ?? 'No app name';
      const subtitle = props.flow.sourceNamespace ? (
        <span className={css.subtitle}>{props.flow.sourceNamespace}</span>
      ) : (
        ''
      );
      // prettier-ignore
      const title = <>{appName} {subtitle}</>;
      return <div className={css.cell}>{title}</div>;
    }
    case FlowsTableColumn.DstPod: {
      return (
        <div className={css.cell}>
          {props.flow.destinationPodName || (
            <span className={css.emptyValue}>—</span>
          )}
        </div>
      );
    }
    case FlowsTableColumn.DstIp: {
      return <div className={css.cell}>{props.flow.destinationIp}</div>;
    }
    case FlowsTableColumn.DstService: {
      const appName = props.flow.destinationDns
        ? props.flow.destinationDns
        : props.flow.destinationAppName ?? '—';

      const subtitle = props.flow.destinationDns ? (
        ''
      ) : props.flow.destinationNamespace ? (
        <span className={css.subtitle}>{props.flow.destinationNamespace}</span>
      ) : props.flow.destinationIp ? (
        <span className={css.subtitle}>{props.flow.destinationIp}</span>
      ) : (
        ''
      );
      // prettier-ignore
      const title = <>{appName} {subtitle}</>;
      return <div className={css.cell}>{title}</div>;
    }
    case FlowsTableColumn.DstPort: {
      const className = classnames(css.cell, css.dstPort);
      return <div className={className}>{props.flow.destinationPort}</div>;
    }
    case FlowsTableColumn.Verdict: {
      const className = classnames(css.cell, css.verdict, {
        [css.forwardedVerdict]: props.flow.verdict === Verdict.Forwarded,
        [css.droppedVerdict]: props.flow.verdict === Verdict.Dropped,
      });
      return <div className={className}>{props.flow.verdictLabel}</div>;
    }
    case FlowsTableColumn.TcpFlags: {
      return (
        <div className={classnames(css.cell, css.tcpFlags)}>
          {props.flow.joinedTcpFlags}
        </div>
      );
    }
    case FlowsTableColumn.Timestamp: {
      const ts = props.flow.millisecondsTimestamp;
      const timestamp = useWhenOccured(props.ticker, ts);
      const title = props.flow.isoTimestamp || undefined;
      const className = classnames(css.cell, css.timestamp);
      return (
        <div className={className} title={title}>
          {timestamp}
        </div>
      );
    }
    default: {
      return null;
    }
  }
});
