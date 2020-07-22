import { Icon } from '@blueprintjs/core';
import React, { memo } from 'react';

import { Flow, FlowsFilterDirection, Verdict } from '~/domain/flows';

import { FiltersProps } from './general';
import {
  LabelsBody,
  TCPFlagsBody,
  VerdictBodyItem,
  IPBodyItem,
  DnsBodyItem,
  IdentityBodyItem,
  PodBodyItem,
} from './SidebarComponents';

import css from './styles.scss';

export interface Props extends FiltersProps {
  flow: Flow;
  onClose?: () => void;
}

export const FlowsTableSidebar = memo<Props>(function FlowsTableSidebar(props) {
  const { flow } = props;

  return (
    <div className={css.sidebar}>
      <header className={css.header}>
        <span>Flow Details</span>
        <Icon className={css.close} icon="cross" onClick={props.onClose} />
      </header>
      <section className={css.block}>
        <span className={css.title}>Timestamp</span>
        <div className={css.body}>{flow.isoTimestamp}</div>
      </section>
      <section className={css.block}>
        <span className={css.title}>Verdict</span>
        <div className={css.body}>
          <VerdictBodyItem
            verdict={flow.verdict}
            dataFilters={props.dataFilters}
            onSelectFilters={props.onSelectFilters}
          />
        </div>
      </section>
      {flow.verdict === Verdict.Dropped && (
        <section className={css.block}>
          <span className={css.title}>Drop reason</span>
          <div className={css.body}>{flow.dropReason}</div>
        </section>
      )}
      <section className={css.block}>
        <span className={css.title}>Traffic direction</span>
        <div className={css.body}>{flow.trafficDirectionLabel}</div>
      </section>
      {flow.ciliumEventSubTypeLabel && (
        <section className={css.block}>
          <span className={css.title}>Cilium event type</span>
          <div className={css.body}>{flow.ciliumEventSubTypeLabel}</div>
        </section>
      )}
      {flow.enabledTcpFlags.length > 0 && (
        <section className={css.block}>
          <span className={css.title}>TCP flags</span>
          <div className={css.body}>
            <TCPFlagsBody
              flags={flow.enabledTcpFlags}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.Both}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      <hr />
      {flow.hasSource && flow.sourcePodName && (
        <section className={css.block}>
          <span className={css.title}>Source pod</span>
          <div className={css.body}>
            <PodBodyItem
              pod={flow.sourcePodName}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.From}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      {flow.hasSource && flow.sourceIdentity && (
        <section className={css.block}>
          <span className={css.title}>Source identity</span>
          <div className={css.body}>
            <IdentityBodyItem
              identity={flow.sourceIdentity}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.From}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      {flow.hasSource && flow.sourceLabels.length > 0 && (
        <section className={css.block}>
          <span className={css.title}>Source labels</span>
          <div className={css.body}>
            <LabelsBody
              labels={flow.sourceLabels}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.From}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      {flow.hasSource && flow.sourceIp && (
        <section className={css.block}>
          <span className={css.title}>Source IP</span>
          <div className={css.body}>
            <IPBodyItem
              ip={flow.sourceIp}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.From}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      <hr />
      {flow.hasDestination && flow.destinationPodName && (
        <section className={css.block}>
          <span className={css.title}>Destination pod</span>
          <div className={css.body}>
            <PodBodyItem
              pod={flow.destinationPodName}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.To}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && flow.destinationIdentity && (
        <section className={css.block}>
          <span className={css.title}>Destination identity</span>
          <div className={css.body}>
            <IdentityBodyItem
              identity={flow.destinationIdentity}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.To}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && flow.destinationLabels.length > 0 && (
        <section className={css.block}>
          <span className={css.title}>Destination labels</span>
          <div className={css.body}>
            <LabelsBody
              labels={flow.destinationLabels}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.To}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && flow.destinationIp && (
        <section className={css.block}>
          <span className={css.title}>Destination IP</span>
          <div className={css.body}>
            <IPBodyItem
              ip={flow.destinationIp}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.To}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && flow.destinationDns && (
        <section className={css.block}>
          <span className={css.title}>Destination DNS</span>
          <div className={css.body}>
            <DnsBodyItem
              dns={flow.destinationDns}
              dataFilters={props.dataFilters}
              filterDirection={FlowsFilterDirection.Both}
              onSelectFilters={props.onSelectFilters}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && typeof flow.destinationPort === 'number' && (
        <section className={css.block}>
          <span className={css.title}>Destination port</span>
          <div className={css.body}>{flow.destinationPort}</div>
        </section>
      )}
    </div>
  );
});
