import React, { memo, FunctionComponent } from 'react';
import { Icon } from '@blueprintjs/core';

import { Flow } from '~/domain/flows';
import { KV } from '~/domain/misc';

import css from './styles.scss';

export interface Props {
  flow: Flow;
  onClose?: () => void;
}

export const FlowsTableSidebar = memo<Props>(function FlowsTableSidebar(props) {
  const { flow } = props;

  const {
    hasSource,
    hasDestination,
    isoTimestamp,
    verdictLabel,
    ciliumEventSubTypeLabel,
    sourcePodName,
    sourceLabels,
    sourceIp,
    destinationLabels,
    destinationPodName,
    destinationDns,
    destinationPort,
    destinationIp,
    trafficDirectionLabel,
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
        <span className={css.title}>Traffic direction</span>
        <div className={css.body}>{trafficDirectionLabel}</div>
      </section>
      {ciliumEventSubTypeLabel && (
        <section className={css.block}>
          <span className={css.title}>Cilium event type</span>
          <div className={css.body}>{ciliumEventSubTypeLabel}</div>
        </section>
      )}
      <hr />
      {hasSource && sourcePodName && (
        <section className={css.block}>
          <span className={css.title}>Source pod</span>
          <div className={css.body}>{sourcePodName}</div>
        </section>
      )}
      {hasSource && sourceLabels.length > 0 && (
        <section className={css.block}>
          <span className={css.title}>Source labels</span>
          <div className={css.body}>
            <Labels labels={sourceLabels} />
          </div>
        </section>
      )}
      {hasSource && sourceIp && (
        <section className={css.block}>
          <span className={css.title}>Source IP</span>
          <div className={css.body}>{sourceIp}</div>
        </section>
      )}
      <hr />
      {hasDestination && destinationPodName && (
        <section className={css.block}>
          <span className={css.title}>Destination pod</span>
          <div className={css.body}>{destinationPodName}</div>
        </section>
      )}
      {hasDestination && destinationLabels.length > 0 && (
        <section className={css.block}>
          <span className={css.title}>Destination labels</span>
          <div className={css.body}>
            <Labels labels={destinationLabels} />
          </div>
        </section>
      )}
      {hasDestination && destinationIp && (
        <section className={css.block}>
          <span className={css.title}>Destination IP</span>
          <div className={css.body}>{destinationIp}</div>
        </section>
      )}
      {hasDestination && destinationDns && (
        <section className={css.block}>
          <span className={css.title}>Destination DNS</span>
          <div className={css.body}>{destinationDns}</div>
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

const Labels: FunctionComponent<{ labels: KV[] }> = props => {
  const cnt = props.labels.length;

  return (
    <div className={css.labels}>
      {props.labels.map(({ key, value }, idx) => {
        const isLastLabel = idx + 1 === cnt;

        let title = key;
        if (value) {
          title += `=${value}`;
        }
        return (
          <React.Fragment key={`${key}=${value}`}>
            <div>{title}</div>
            {isLastLabel ? '' : ' '}
          </React.Fragment>
        );
      })}
    </div>
  );
};
