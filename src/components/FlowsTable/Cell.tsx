import classnames from 'classnames';
import React, { memo } from 'react';

import { Flow, Verdict } from '~/domain/flows';
import { Ticker } from '~/utils/ticker';

import { Column, TickerEvents } from './general';
import { useWhenOccured } from './hooks/useWhenOccured';

import css from './styles.scss';

export interface CellProps {
  flow: Flow;
  kind: Column;
  ticker?: Ticker<TickerEvents>;
}

export const Cell = memo<CellProps>(function FlowsTableCell(props) {
  switch (props.kind) {
    case Column.SrcPod: {
      return (
        <div className={css.cell}>
          {props.flow.sourcePodName || (
            <span className={css.emptyValue}>—</span>
          )}
        </div>
      );
    }
    case Column.SrcIp: {
      return <div className={css.cell}>{props.flow.sourceIp}</div>;
    }
    case Column.SrcService: {
      const appName = props.flow.sourceIdentityName ?? 'No app name';
      const subtitle = props.flow.sourceNamespace ? (
        <span className={css.subtitle}>{props.flow.sourceNamespace}</span>
      ) : (
        ''
      );
      // prettier-ignore
      const title = <>{appName} {subtitle}</>;
      return <div className={css.cell}>{title}</div>;
    }
    case Column.DstPod: {
      return (
        <div className={css.cell}>
          {props.flow.destinationPodName || (
            <span className={css.emptyValue}>—</span>
          )}
        </div>
      );
    }
    case Column.DstIp: {
      return <div className={css.cell}>{props.flow.destinationIp}</div>;
    }
    case Column.DstService: {
      const appName = props.flow.destinationDns
        ? props.flow.destinationDns
        : props.flow.destinationIdentityName ?? '—';

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
    case Column.DstPort: {
      const className = classnames(css.cell, css.dstPort);
      return <div className={className}>{props.flow.destinationPort}</div>;
    }
    case Column.Verdict: {
      const className = classnames(css.cell, css.verdict, {
        [css.forwardedVerdict]: props.flow.verdict === Verdict.Forwarded,
        [css.droppedVerdict]: props.flow.verdict === Verdict.Dropped,
      });
      return <div className={className}>{props.flow.verdictLabel}</div>;
    }
    case Column.TcpFlags: {
      return (
        <div className={classnames(css.cell, css.tcpFlags)}>
          {props.flow.joinedTcpFlags}
        </div>
      );
    }
    case Column.Timestamp: {
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
