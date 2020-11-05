import { Flow, Verdict } from '~/domain/flows';
import {
  FilterEntry,
  Kind as FilterKind,
  Direction as FilterDirection,
} from './filter-entry';

import { Link, Service, ServiceCard } from '~/domain/service-map';
import { Filters, FiltersObject } from './filters';

export { Filters, FiltersObject };
export { FilterEntry, FilterKind, FilterDirection };

export const filterFlow = (flow: Flow, filters: Filters): boolean => {
  if (filters.namespace != null) {
    if (
      flow.sourceNamespace !== filters.namespace &&
      flow.destinationNamespace !== filters.namespace
    )
      return false;
  }

  if (filters.verdict != null && flow.verdict !== filters.verdict) {
    return false;
  }

  if (filters.httpStatus != null) {
    if (flow.httpStatus == null) return false;

    const httpStatus = parseInt(filters.httpStatus);
    const lastChar = filters.httpStatus.slice(-1);
    const rangeSign = ['+', '-'].includes(lastChar) ? lastChar : undefined;

    if (!rangeSign && flow.httpStatus !== httpStatus) return false;
    if (rangeSign === '+' && flow.httpStatus < httpStatus) return false;
    if (rangeSign === '-' && flow.httpStatus > httpStatus) return false;
  }

  let ok = true;
  filters.filters?.forEach((ff: FilterEntry) => {
    const passed = filterFlowUsingBasicEntry(flow, ff);

    ok = ok && passed;
  });

  return ok;
};

export const filterLink = (link: Link, filters: Filters): boolean => {
  if (filters.verdict != null && !link.verdicts.has(filters.verdict)) {
    return false;
  }

  let ok = true;
  filters.filters?.forEach((ff: FilterEntry) => {
    const passed = filterLinkUsingBasicEntry(link, ff);

    ok = ok && passed;
  });

  return ok;
};

export const filterService = (svc: ServiceCard, filters: Filters): boolean => {
  if (filters.skipHost && svc.isHost) return false;
  // if (filters.skipKubeDns && svc.isKubeDNS) return false;
  if (filters.skipRemoteNode && svc.isRemoteNode) return false;
  if (filters.skipRemoteNode && svc.isPrometheusApp) return false;

  let ok = true;
  filters.filters?.forEach((ff: FilterEntry) => {
    const passed = filterServiceUsingBasicEntry(svc.service, ff);

    ok = ok && passed;
  });

  return ok;
};

export const filterServiceUsingBasicEntry = (
  service: Service,
  e: FilterEntry,
): boolean => {
  if (e.isIdentity) return service.id === e.query;

  if (e.isLabel) {
    const labels = service.labels.map(kv => {
      if (!kv.value) return kv.key;
      return `${kv.key}=${kv.value}`;
    });
    return labels.includes(e.query);
  }

  if (e.isDNS) {
    return service.dnsNames.includes(e.query) || service.id === e.query;
  }

  return true;
};

export const filterLinkUsingBasicEntry = (l: Link, e: FilterEntry): boolean => {
  const sourceIdentityMatch = l.sourceId === e.query;
  const destIdentityMatch = l.destinationId === e.query;

  switch (e.direction) {
    case FilterDirection.Both: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!sourceIdentityMatch && !destIdentityMatch) return false;
          break;
        }
      }
      break;
    }
    case FilterDirection.To: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!destIdentityMatch) return false;
          break;
        }
      }
      break;
    }
    case FilterDirection.From: {
      switch (e.kind) {
        case FilterKind.Identity: {
          if (!sourceIdentityMatch) return false;
          break;
        }
      }
      break;
    }
  }

  return true;
};

export const filterFlowUsingBasicEntry = (
  flow: Flow,
  filter: FilterEntry,
): boolean => {
  const [key, value] = filter.labelKeyValue;

  // TODO: improve performance: check only in appropriate switch/case
  const sourceLabelMatch = flow.sourceLabels.some(
    label => label.key === key && label.value === value,
  );
  const destLabelMatch = flow.destinationLabels.some(
    label => label.key === key && label.value === value,
  );

  const sourceDnsMatch = flow.sourceNamesList.includes(filter.query);
  const destDnsMatch = flow.destinationNamesList.includes(filter.query);

  const sourceIdentityMatch = flow.sourceIdentity === +filter.query;
  const destIdentityMatch = flow.destinationIdentity === +filter.query;

  const sourcePodMatch = flow.sourcePodName === filter.query;
  const destPodMatch = flow.destinationPodName === filter.query;

  const tcpFlagMatch = flow.enabledTcpFlags.includes(filter.query as any);

  switch (filter.direction) {
    case FilterDirection.Both: {
      switch (filter.kind) {
        case FilterKind.Label: {
          if (!sourceLabelMatch && !destLabelMatch) return false;
          break;
        }
        case FilterKind.Ip: {
          if (
            flow.sourceIp !== filter.query &&
            flow.destinationIp !== filter.query
          ) {
            return false;
          }
          break;
        }
        case FilterKind.Dns: {
          if (!sourceDnsMatch && !destDnsMatch) return false;
          break;
        }
        case FilterKind.Identity: {
          if (!sourceIdentityMatch && !destIdentityMatch) return false;
          break;
        }
        case FilterKind.TCPFlag: {
          if (!tcpFlagMatch) return false;
          break;
        }
        case FilterKind.Pod: {
          if (!sourcePodMatch && !destPodMatch) return false;
          break;
        }
      }
      break;
    }
    case FilterDirection.From: {
      switch (filter.kind) {
        case FilterKind.Label: {
          if (!sourceLabelMatch) return false;
          break;
        }
        case FilterKind.Ip: {
          if (flow.sourceIp !== filter.query) return false;
          break;
        }
        case FilterKind.Dns: {
          if (!sourceDnsMatch) return false;
          break;
        }
        case FilterKind.Identity: {
          if (!sourceIdentityMatch) return false;
          break;
        }
        case FilterKind.TCPFlag: {
          if (!tcpFlagMatch) return false;
          break;
        }
        case FilterKind.Pod: {
          if (!sourcePodMatch) return false;
          break;
        }
      }
      break;
    }
    case FilterDirection.To: {
      switch (filter.kind) {
        case FilterKind.Label: {
          if (!destLabelMatch) return false;
          break;
        }
        case FilterKind.Ip: {
          if (flow.destinationIp !== filter.query) return false;
          break;
        }
        case FilterKind.Dns: {
          if (!destDnsMatch) return false;
          break;
        }
        case FilterKind.Identity: {
          if (!destIdentityMatch) return false;
          break;
        }
        case FilterKind.TCPFlag: {
          if (!tcpFlagMatch) return false;
          break;
        }
        case FilterKind.Pod: {
          if (!destPodMatch) return false;
          break;
        }
      }
      break;
    }
  }

  return true;
};
