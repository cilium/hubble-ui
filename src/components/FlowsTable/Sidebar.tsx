import { Icon } from '@blueprintjs/core';
import React, { memo, useCallback, useMemo, useEffect, useState } from 'react';

import { Flow, Verdict } from '~/domain/flows';
import { Filters, FilterEntry, FilterDirection } from '~/domain/filtering';
import { TCPFlagName, PodSelector, IPProtocol, AuthType } from '~/domain/hubble';
import { KV, Labels } from '~/domain/labels';

import {
  LabelsEntry,
  TCPFlagsEntry,
  VerdictEntry,
  IPEntry,
  DnsBodyItem,
  IdentityEntry,
  PodEntry,
} from './SidebarComponents';

import css from './styles.scss';

export interface Props {
  flow: Flow;
  filters: Filters;
  onClose?: () => void;
  onVerdictClick?: (verdict: Verdict | null) => void;
  onTcpFlagClick?: (flag?: TCPFlagName, direction?: FilterDirection) => void;
  onLabelClick?: (label?: KV, direction?: FilterDirection) => void;
  onPodClick?: (podSelector?: PodSelector, direction?: FilterDirection) => void;
  onIdentityClick?: (identity?: string, direction?: FilterDirection) => void;
  onIpClick?: (ip?: string, direction?: FilterDirection) => void;
  onDnsClick?: (dns?: string) => void;
}

export const FlowsTableSidebar = memo<Props>(function FlowsTableSidebar(props) {
  const { flow } = props;

  const tcpFilterDirection = FilterDirection.From;
  const isVerdictSelected = !!props.filters.verdicts?.has(flow.verdict);
  const protocol = props.flow.protocolStr;

  const onVerdictClick = useCallback(() => {
    props.onVerdictClick?.(isVerdictSelected ? null : flow.verdict);
  }, [props.flow, isVerdictSelected, props.onVerdictClick]);

  const flowTcpFlags = flow.enabledTcpFlags.reduce((acc, flag: TCPFlagName) => {
    acc.add(flag);
    return acc;
  }, new Set<TCPFlagName>());

  const [labelsSelection, setLabelSelection] = useState<Set<string>>(new Set());
  const [podSelection, setPodSelection] = useState<Set<string>>(new Set());
  const [identitySelection, setIdSelection] = useState<Set<number>>(new Set());
  const [ipSelection, setIpSelection] = useState<Set<string>>(new Set());
  const [tcpFlagSelection, setTCPSelection] = useState<Set<TCPFlagName>>(new Set());

  const [isDnsSelected, setDnsSelected] = useState(false);

  useEffect(() => {
    const lblSelection: Set<string> = new Set();
    const podsSelection: Set<string> = new Set();
    const idtySelection: Set<number> = new Set();
    const ipsSelection: Set<string> = new Set();

    const sourceLabels = props.flow.sourceLabels.reduce((acc, lbl: KV) => {
      const concatedLabel = Labels.concatKV(lbl);
      acc.add(concatedLabel);

      return acc;
    }, new Set<string>());

    const destLabels = props.flow.destinationLabels.reduce((acc, lbl: KV) => {
      const concatedLabel = Labels.concatKV(lbl);
      acc.add(concatedLabel);

      return acc;
    }, new Set<string>());

    const sourcePodName = props.flow.sourcePodName;
    const destPodName = props.flow.destinationPodName;
    const sourceIdentity = props.flow.sourceIdentity;
    const destIdentity = props.flow.destinationIdentity;
    const sourceIp = props.flow.sourceIp;
    const destIp = props.flow.destinationIp;

    const flowSourcePodEntry = FilterEntry.newPod(sourcePodName!).setDirection(
      FilterDirection.From,
    );

    const flowDestPodEntry = FilterEntry.newPod(destPodName!).setDirection(FilterDirection.To);

    const flowSourceIdtyEntry = FilterEntry.newIdentity(`${sourceIdentity!}`).setDirection(
      FilterDirection.From,
    );

    const flowDestIdtyEntry = FilterEntry.newIdentity(`${destIdentity!}`).setDirection(
      FilterDirection.To,
    );

    const flowSourceIpEntry = FilterEntry.newIP(sourceIp!).setDirection(FilterDirection.From);

    const flowDestIpEntry = FilterEntry.newIP(destIp!).setDirection(FilterDirection.To);

    props.filters.filters?.forEach(filter => {
      if (sourcePodName != null && flowSourcePodEntry.equals(filter)) {
        podsSelection.add(sourcePodName);
      }

      if (destPodName != null && flowDestPodEntry.equals(filter)) {
        podsSelection.add(destPodName);
      }

      if (sourceIdentity != null && flowSourceIdtyEntry.equals(filter)) {
        idtySelection.add(sourceIdentity);
      }

      if (destIdentity != null && flowDestIdtyEntry.equals(filter)) {
        idtySelection.add(destIdentity);
      }

      if (sourceIp != null && flowSourceIpEntry.equals(filter)) {
        ipsSelection.add(sourceIp);
      }

      if (destIp != null && flowDestIpEntry.equals(filter)) {
        ipsSelection.add(destIp);
      }

      if (
        filter.isTCPFlag &&
        filter.direction === tcpFilterDirection &&
        flowTcpFlags.has(filter.query as TCPFlagName)
      ) {
        tcpFlagSelection.add(filter.query as TCPFlagName);
      }

      if (filter.isDNS && filter.query === flow.destinationDns) {
        setDnsSelected(true);
      }

      if (!filter.isLabel) return;
      if (sourceLabels.has(filter.query) || destLabels.has(filter.query)) {
        lblSelection.add(filter.query);
      }
    });

    setLabelSelection(lblSelection);
    setPodSelection(podsSelection);
    setIdSelection(idtySelection);
    setIpSelection(ipsSelection);
  }, [props.flow, props.filters.filters]);

  const onTcpFlagClick = useCallback(
    (flag: TCPFlagName) => {
      const isSelected = tcpFlagSelection.has(flag);
      if (isSelected) {
        return props.onTcpFlagClick?.();
      }

      props.onTcpFlagClick?.(flag, tcpFilterDirection);
    },
    [props.onTcpFlagClick, tcpFlagSelection],
  );

  const onSourceLabelClick = useCallback(
    (label: KV) => {
      const labelStr = Labels.concatKV(label);
      const isSelected = labelsSelection.has(labelStr);

      if (isSelected) {
        return props.onLabelClick?.();
      }

      props.onLabelClick?.(label, FilterDirection.From);
    },
    [props.onLabelClick, labelsSelection],
  );

  const onDestLabelClick = useCallback(
    (label: KV) => {
      const labelStr = Labels.concatKV(label);
      const isSelected = labelsSelection.has(labelStr);

      if (isSelected) {
        return props.onLabelClick?.();
      }

      props.onLabelClick?.(label, FilterDirection.To);
    },
    [props.onLabelClick, labelsSelection],
  );

  const onSourcePodNameClick = useCallback(
    (podSelector: PodSelector) => {
      const isSelected = podSelection.has(podSelector.pod);

      if (isSelected) {
        return props.onPodClick?.();
      }

      props.onPodClick?.(podSelector, FilterDirection.From);
    },
    [podSelection, props.flow, props.onPodClick],
  );

  const onDestPodNameClick = useCallback(
    (podSelector: PodSelector) => {
      const isSelected = podSelection.has(podSelector.pod);

      if (isSelected) {
        return props.onPodClick?.();
      }

      props.onPodClick?.(podSelector, FilterDirection.To);
    },
    [props.onPodClick, podSelection],
  );

  const onSourceIdentityClick = useCallback(() => {
    const identity = props.flow.sourceIdentity;
    const isSelected = identitySelection.has(identity!);

    if (identity == null || isSelected) {
      return props.onIdentityClick?.();
    }

    props.onIdentityClick?.(`${identity}`, FilterDirection.From);
  }, [props.onIdentityClick, props.flow, identitySelection]);

  const onDestIdentityClick = useCallback(() => {
    const identity = props.flow.destinationIdentity;
    const isSelected = identitySelection.has(identity!);

    if (identity == null || isSelected) {
      return props.onIdentityClick?.();
    }

    props.onIdentityClick?.(`${identity}`, FilterDirection.To);
  }, [props.onIdentityClick, props.flow, identitySelection]);

  const onSourceIpClick = useCallback(() => {
    const ip = props.flow.sourceIp;
    const isSelected = ipSelection.has(ip!);

    if (ip == null || isSelected) {
      return props.onIpClick?.();
    }

    props.onIpClick?.(ip, FilterDirection.From);
  }, [props.onIpClick, props.flow, ipSelection]);

  const onDestIpClick = useCallback(() => {
    const ip = props.flow.destinationIp;
    const isSelected = ipSelection.has(ip!);

    if (ip == null || isSelected) {
      return props.onIpClick?.();
    }

    props.onIpClick?.(ip, FilterDirection.To);
  }, [props.onIpClick, props.flow, ipSelection]);

  const onDnsClick = useCallback(() => {
    if (isDnsSelected || props.flow.destinationDns == null) {
      return props.onDnsClick?.();
    }

    props.onDnsClick?.(props.flow.destinationDns);
  }, [props.flow, props.onDnsClick, isDnsSelected]);

  const isICMPProtocol =
    props.flow.protocol === IPProtocol.ICMPv4 || props.flow.protocol === IPProtocol.ICMPv6;

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
          <VerdictEntry
            verdict={flow.verdict}
            isSelected={isVerdictSelected}
            onClick={onVerdictClick}
          />
        </div>
      </section>
      {flow.verdict === Verdict.Dropped && (
        <section className={css.block}>
          <span className={css.title}>Drop reason</span>
          <div className={css.body}>{flow.dropReason}</div>
        </section>
      )}
      {flow.authType !== AuthType.Disbaled && (
        <section className={css.block}>
          <span className={css.title}>Authentication</span>
          <div className={css.body}>{flow.authTypeLabel}</div>
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
            <TCPFlagsEntry
              flags={flow.enabledTcpFlags}
              selected={tcpFlagSelection}
              filterDirection={tcpFilterDirection}
              onClick={onTcpFlagClick}
            />
          </div>
        </section>
      )}
      <hr />
      {flow.hasSource && flow.sourcePodName && (
        <section className={css.block}>
          <span className={css.title}>Source pod</span>
          <div className={css.body}>
            <PodEntry
              podSelector={flow.sourcePodSelector}
              isSelected={podSelection.has(flow.sourcePodName)}
              onClick={onSourcePodNameClick}
            />
          </div>
        </section>
      )}
      {flow.hasSource && typeof flow.sourceIdentity === 'number' && (
        <section className={css.block}>
          <span className={css.title}>Source identity</span>
          <div className={css.body}>
            <IdentityEntry
              identity={flow.sourceIdentity}
              isSelected={identitySelection.has(flow.sourceIdentity)}
              onClick={onSourceIdentityClick}
            />
          </div>
        </section>
      )}
      {flow.hasSource && flow.sourceLabels.length > 0 && (
        <section className={css.block}>
          <span className={css.title}>Source labels</span>
          <div className={css.body}>
            <LabelsEntry
              labels={flow.sourceLabels}
              selected={labelsSelection}
              onClick={onSourceLabelClick}
            />
          </div>
        </section>
      )}
      {flow.hasSource && flow.sourceIp && (
        <section className={css.block}>
          <span className={css.title}>Source IP</span>
          <div className={css.body}>
            <IPEntry
              ip={flow.sourceIp}
              isSelected={ipSelection.has(flow.sourceIp)}
              onClick={onSourceIpClick}
            />
          </div>
        </section>
      )}
      <hr />
      {flow.hasDestination && flow.destinationPodName && (
        <section className={css.block}>
          <span className={css.title}>Destination pod</span>
          <div className={css.body}>
            <PodEntry
              podSelector={flow.destinationPodSelector}
              isSelected={podSelection.has(flow.destinationPodName)}
              onClick={onDestPodNameClick}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && typeof flow.destinationIdentity === 'number' && (
        <section className={css.block}>
          <span className={css.title}>Destination identity</span>
          <div className={css.body}>
            <IdentityEntry
              identity={flow.destinationIdentity}
              isSelected={identitySelection.has(flow.destinationIdentity)}
              onClick={onDestIdentityClick}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && flow.destinationLabels.length > 0 && (
        <section className={css.block}>
          <span className={css.title}>Destination labels</span>
          <div className={css.body}>
            <LabelsEntry
              labels={flow.destinationLabels}
              selected={labelsSelection}
              onClick={onDestLabelClick}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && flow.destinationIp && (
        <section className={css.block}>
          <span className={css.title}>Destination IP</span>
          <div className={css.body}>
            <IPEntry
              ip={flow.destinationIp}
              isSelected={ipSelection.has(flow.destinationIp)}
              onClick={onDestIpClick}
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
              isSelected={isDnsSelected}
              onClick={onDnsClick}
            />
          </div>
        </section>
      )}
      {flow.hasDestination && flow.protocol && (
        <section className={css.block}>
          <span className={css.title}>Destination {!isICMPProtocol && 'port • '}protocol</span>
          <div className={css.body}>
            {flow.destinationPort && `${flow.destinationPort} • `}
            {protocol && `${protocol}`}
          </div>
        </section>
      )}
    </div>
  );
});
