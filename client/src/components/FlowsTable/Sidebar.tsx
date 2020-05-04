import React, { memo, FunctionComponent } from 'react';
import { Flow } from '~/domain/flows';
import css from './styles.scss';
import { Icon } from '@blueprintjs/core';
import { DNS } from '~/domain/hubble';
import { KV } from '~/domain/misc';

export interface Props {
  flow: Flow;
  onClose: () => void;
}

export const FlowsTableSidebar = memo<Props>(props => {
  const { flow } = props;

  const {
    hasSource,
    hasDestination,
    isoTimestamp,
    verdictLabel,
    direction,
    ciliumEventSubTypeLabel,
    sourcePodName,
    sourceLabels,
    sourceIp,
    destinationLabels,
    destinationPodName,
    destinationDns,
    destinationPort,
    destinationIp,
  } = flow;

  return (
    <div className={css.sidebar}>
      <header className={css.header}>
        <span>Flow Details</span>
        <Icon className={css.close} icon="cross" onClick={props.onClose} />
      </header>
      <section className={css.block}>
        <span className={css.title}>Timestamp</span>
        <div className={css.body}>{isoTimestamp}</div>
      </section>
      <section className={css.block}>
        <span className={css.title}>Verdict</span>
        <div className={css.body}>{verdictLabel}</div>
      </section>
      <section className={css.block}>
        <span className={css.title}>Direction</span>
        <div className={css.body}>{direction}</div>
      </section>
      <section className={css.block}>
        <span className={css.title}>Cilium event type</span>
        <div className={css.body}>
          {ciliumEventSubTypeLabel ? ciliumEventSubTypeLabel : 'unknown'}
        </div>
      </section>
      <hr />
      {hasSource && (
        <section className={css.block}>
          <span className={css.title}>Source pod</span>
          <div className={css.body}>
            {sourcePodName ? sourcePodName : 'unknown'}
          </div>
        </section>
      )}
      {hasSource && (
        <section className={css.block}>
          <span className={css.title}>Source labels</span>
          <div className={css.body}>
            {sourceLabels.length > 0 ? (
              <Labels labels={sourceLabels} />
            ) : (
              'No labels'
            )}
          </div>
        </section>
      )}
      {hasSource && (
        <section className={css.block}>
          <span className={css.title}>Source IP</span>
          <div className={css.body}>{sourceIp ? sourceIp : 'unknown'}</div>
        </section>
      )}
      <hr />
      {hasDestination && (
        <section className={css.block}>
          <span className={css.title}>Destination pod</span>
          <div className={css.body}>
            {destinationPodName ? destinationPodName : 'unknown'}
          </div>
        </section>
      )}
      {hasDestination && (
        <section className={css.block}>
          <span className={css.title}>Destination labels</span>
          <div className={css.body}>
            {destinationLabels.length > 0 ? (
              <Labels labels={destinationLabels} />
            ) : (
              'No labels'
            )}
          </div>
        </section>
      )}
      {hasDestination && (
        <section className={css.block}>
          <span className={css.title}>Destination IP</span>
          <div className={css.body}>
            {destinationIp ? destinationIp : 'unknown'}
          </div>
        </section>
      )}
      {hasDestination && destinationDns && (
        <section className={css.block}>
          <span className={css.title}>Destination DNS</span>
          <div className={css.body}>
            <DNSInfo dns={destinationDns} />
          </div>
        </section>
      )}
      {hasDestination && typeof destinationPort === 'number' && (
        <section className={css.block}>
          <span className={css.title}>Destination port</span>
          <div className={css.body}>{destinationPort}</div>
        </section>
      )}
    </div>
  );
});

FlowsTableSidebar.displayName = 'FlowsTableSidebar';

const DNSInfo: FunctionComponent<{ dns: DNS }> = props => {
  return (
    <>
      <div>
        <b>Query:</b> {props.dns.query}
      </div>
      <div>
        <b>RCODE:</b> {props.dns.rcode}
      </div>
      <div>
        <b>IPs:</b> {props.dns.ipsList.join(', ')}
      </div>
    </>
  );
};

const Labels: FunctionComponent<{ labels: KV[] }> = props => {
  return (
    <div className={css.labels}>
      {props.labels.map(({ key, value }) => {
        let title = key;
        if (value) {
          title += `=${value}`;
        }
        return <div key={`${key}=${value}`}>{title}</div>;
      })}
    </div>
  );
};
