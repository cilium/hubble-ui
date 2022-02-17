import { FlowFilter, EventTypeFilter } from '~backend/proto/flow/flow_pb';

import * as helpers from '~/domain/helpers';
import { CiliumEventTypes } from '~/domain/cilium';
import { ReservedLabel, SpecialLabel } from '~/domain/labels';
import { Filters, FilterEntry, FilterKind } from '~/domain/filtering';

export type FlowFilters = [FlowFilter[], FlowFilter[]];

export const baseWhitelistFilter = (filters?: Filters): FlowFilter => {
  const wlFilter = new FlowFilter();

  const eventTypes: CiliumEventTypes[] = [];
  if (filters?.httpStatus) {
    // Filter by http status code allows only l7 event type
    eventTypes.push(CiliumEventTypes.L7);
    wlFilter.addHttpStatusCode(filters.httpStatus);
  } else {
    eventTypes.push(
      CiliumEventTypes.Drop,
      CiliumEventTypes.Trace,
      CiliumEventTypes.L7,
    );
  }

  eventTypes.forEach(eventTypeNumber => {
    const eventTypeFilter = new EventTypeFilter();
    eventTypeFilter.setType(eventTypeNumber);

    wlFilter.addEventType(eventTypeFilter);
  });

  if (filters?.verdict) {
    wlFilter.addVerdict(helpers.verdict.verdictToPb(filters.verdict));
  }

  // TODO: code for handling tcp flags should be here
  // NOTE: 1.9.1 gets rid of that field, wait for the next release

  wlFilter.addReply(false);
  return wlFilter;
};

export const buildBlacklistFlowFilters = (filters?: Filters): FlowFilter[] => {
  const blFilters: FlowFilter[] = [];

  const blSrcLabelsFilter = new FlowFilter();
  const blDstLabelsFilter = new FlowFilter();
  blFilters.push(blSrcLabelsFilter, blDstLabelsFilter);

  blSrcLabelsFilter.addSourceLabel(ReservedLabel.Unknown);
  blDstLabelsFilter.addDestinationLabel(ReservedLabel.Unknown);

  if (filters?.skipHost) {
    blSrcLabelsFilter.addSourceLabel(ReservedLabel.Host);
    blDstLabelsFilter.addDestinationLabel(ReservedLabel.Host);
  }

  if (filters?.skipKubeDns) {
    blSrcLabelsFilter.addSourceLabel(SpecialLabel.KubeDNS);

    const blDstKubeDns = new FlowFilter();
    // TODO: consider this line to remove, as if service is Unmanaged, flows to
    // TOOD: 53 port will be allowed; don't forget to fix `filter-flow.ts` too
    blDstKubeDns.addDestinationLabel(SpecialLabel.KubeDNS);
    blDstKubeDns.addDestinationPort('53');
    blFilters.push(blDstKubeDns);
  }

  if (filters?.skipRemoteNode) {
    blSrcLabelsFilter.addSourceLabel(ReservedLabel.RemoteNode);
    blDstLabelsFilter.addDestinationLabel(ReservedLabel.RemoteNode);
  }

  if (filters?.skipPrometheusApp) {
    blSrcLabelsFilter.addSourceLabel(SpecialLabel.PrometheusApp);
    blDstLabelsFilter.addDestinationLabel(SpecialLabel.PrometheusApp);
  }

  // filter out intermediate dns requests
  const blSrcLocalDnsFilter = new FlowFilter();
  const blDstLocalDnsFilter = new FlowFilter();
  blSrcLocalDnsFilter.addSourceFqdn('*.cluster.local*');
  blDstLocalDnsFilter.addDestinationFqdn('*.cluster.local*');
  blFilters.push(blSrcLocalDnsFilter, blDstLocalDnsFilter);

  // filter out icmp flows
  const blICMPv4Filter = new FlowFilter();
  const blICMPv6Filter = new FlowFilter();
  blICMPv4Filter.addProtocol('ICMPv4');
  blICMPv6Filter.addProtocol('ICMPv6');
  blFilters.push(blICMPv4Filter, blICMPv6Filter);

  return blFilters;
};

export const filterEntryWhitelistFilters = (
  filters: Filters,
  filter: FilterEntry,
): FlowFilter[] => {
  const { kind, query } = filter;
  const wlFilters: FlowFilter[] = [];

  const podsInNamespace = filters.namespace ? `${filters.namespace}/` : null;
  const pod = filter.podNamespace
    ? `${filter.podNamespace}/${filter.query}`
    : filters.namespace
    ? `${filters.namespace}/${filter.query}`
    : null;

  if (filter.fromRequired) {
    // NOTE: this makes possible to catch flows [outside of ns] -> [ns]
    // NOTE: but flows [ns] -> [outside of ns] are lost...
    const toInside = baseWhitelistFilter(filters);
    podsInNamespace && toInside.addDestinationPod(podsInNamespace);

    // NOTE: ...this filter fixes this last case
    const fromInside = baseWhitelistFilter(filters);
    podsInNamespace && fromInside.addSourcePod(podsInNamespace);

    switch (kind) {
      case FilterKind.Label: {
        toInside.addSourceLabel(query);
        fromInside.addSourceLabel(query);
        break;
      }
      case FilterKind.Ip: {
        toInside.addSourceIp(query);
        fromInside.addSourceIp(query);
        break;
      }
      case FilterKind.Dns: {
        toInside.addSourceFqdn(query);
        fromInside.addSourceFqdn(query);
        break;
      }
      case FilterKind.Identity: {
        toInside.addSourceIdentity(+query);
        fromInside.addSourceIdentity(+query);
        break;
      }
      case FilterKind.Pod: {
        pod && toInside.addSourcePod(pod);
        fromInside.clearSourcePodList();

        if (pod && podsInNamespace && !pod.startsWith(podsInNamespace)) {
          fromInside.addDestinationPod(podsInNamespace);
        }
        pod && fromInside.addSourcePod(pod);
        break;
      }
    }

    wlFilters.push(toInside, fromInside);
  }

  if (filter.toRequired) {
    // NOTE: this makes possible to catch flows [ns] -> [outside of ns]
    // NOTE: but flows [outside of ns] -> [ns] are lost...
    const fromInside = baseWhitelistFilter(filters);
    podsInNamespace && fromInside.addSourcePod(podsInNamespace);

    // NOTE: ...this filter fixes this last case
    const toInside = baseWhitelistFilter(filters);
    podsInNamespace && toInside.addDestinationPod(podsInNamespace);

    switch (kind) {
      case FilterKind.Label: {
        fromInside.addDestinationLabel(query);
        toInside.addDestinationLabel(query);
        break;
      }
      case FilterKind.Ip: {
        fromInside.addDestinationIp(query);
        toInside.addDestinationIp(query);
        break;
      }
      case FilterKind.Dns: {
        fromInside.addDestinationFqdn(query);
        toInside.addDestinationFqdn(query);
        break;
      }
      case FilterKind.Identity: {
        fromInside.addDestinationIdentity(+query);
        toInside.addDestinationIdentity(+query);
        break;
      }
      case FilterKind.Pod: {
        pod && fromInside.addDestinationPod(pod);
        toInside.clearDestinationPodList();

        if (podsInNamespace && pod && !pod.startsWith(podsInNamespace)) {
          toInside.addSourcePod(podsInNamespace);
        }
        pod && toInside.addDestinationPod(pod);
        break;
      }
    }

    wlFilters.push(fromInside, toInside);
  }

  return wlFilters;
};

// Taken from previous FlowStream class
export const buildFlowFilters = (filters: Filters): FlowFilters => {
  const wlFilters: FlowFilter[] = [];
  const blFilters = buildBlacklistFlowFilters(filters);

  if (!filters.filters?.length) {
    const namespace = filters?.namespace;
    if (namespace) {
      const wlSrcFilter = baseWhitelistFilter(filters);
      const wlDstFilter = baseWhitelistFilter(filters);
      wlSrcFilter.addSourcePod(`${namespace}/`);
      wlDstFilter.addDestinationPod(`${namespace}/`);
      wlFilters.push(wlSrcFilter, wlDstFilter);
    } else {
      wlFilters.push(baseWhitelistFilter(filters));
    }
    return [wlFilters, blFilters];
  }

  filters.filters.forEach(filter => {
    wlFilters.push(...filterEntryWhitelistFilters(filters, filter));
  });

  return [wlFilters, blFilters];
};
