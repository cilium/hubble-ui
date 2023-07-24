import classnames from 'classnames';
import parseUrl from 'url-parse';
import React, { memo } from 'react';

import { Flow, Verdict } from '~/domain/flows';
import { L7FlowType, Layer7 } from '~/domain/hubble';
import { httpStatus } from '~/domain/status';
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
    case Column.L7Info: {
      const className = classnames(css.cell, css.l7info);

      if (!props.flow.hasL7Info) return <div className={className}>—</div>;

      const l7 = props.flow.l7!;
      const isRequest = l7.type === L7FlowType.Request;
      const isResponse = l7.type === L7FlowType.Response;

      return (
        <div className={className}>
          <span
            className={css.direction}
            title={isRequest ? 'Request' : isResponse ? 'Response' : void 0}
          >
            {isRequest && <>&rarr;</>}
            {isResponse && <>&larr;</>}
          </span>

          {l7.dns != null && <>DNS</>}
          {l7.kafka != null && <>Kafka</>}
          {l7.http != null && (
            <span className={css.http} title={l7title(l7)}>
              <span className={css.method}>{l7.http.method}</span>
              {httpStatus.has(l7.http.code) && (
                <span className={css.status}>
                  {l7.http.code} {httpStatus.get(l7.http.code)}
                </span>
              )}
              <span className={css.path}>{parseUrl(l7.http.url).pathname}</span>
              <span className={css.latency}>
                {(l7.latencyNs / 1e6).toFixed(0)}ms
              </span>
            </span>
          )}
        </div>
      );
    }
    case Column.Verdict: {
      const className = classnames(css.cell, css.verdict, {
        [css.forwardedVerdict]: props.flow.verdict === Verdict.Forwarded,
        [css.droppedVerdict]: props.flow.verdict === Verdict.Dropped,
        [css.auditVerdict]: props.flow.verdict === Verdict.Audit,
      });
      return <div className={className}>{props.flow.verdictLabel}</div>;
    }
    case Column.Auth: {
      return (
        <div className={classnames(css.cell, css.auth)}>
          {props.flow.authTypeLabel}
        </div>
      );
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

const l7title = (l7: Layer7): string => {
  if (l7.dns != null) return 'DNS';
  if (l7.kafka != null) return 'Kafka';
  if (l7.http == null) return '';

  let str = l7.http.method;

  if (httpStatus.has(l7.http.code)) {
    str += `${l7.http.code} ${httpStatus.get(l7.http.code)}`;
  }

  const pathname = parseUrl(l7.http.url).pathname;
  const latency = (l7.latencyNs / 1e6).toFixed(0);

  return `${str} ${pathname} ${latency}ms`;
};
