import {
  FlowsFilterEntry,
  FlowsFilterKind,
  FlowsFilterDirection,
  Flow,
  Verdict,
} from '~/domain/flows';

import { Link, Service } from '~/domain/service-map';
import { ServiceCard } from '~/domain/service-card';

export interface Filters {
  namespace?: string | null;
  verdict?: Verdict | null;
  httpStatus?: string | null;
  filters?: FlowsFilterEntry[];
  skipHost?: boolean;
  skipKubeDns?: boolean;
  skipRemoteNode?: boolean;
  skipPrometheusApp?: boolean;
}

export const areFiltersEqual = (a: Filters, b: Filters): boolean => {
  if (
    a.namespace != b.namespace ||
    a.verdict != b.verdict ||
    a.httpStatus != b.httpStatus ||
    a.skipHost != b.skipHost ||
    a.skipKubeDns != b.skipKubeDns ||
    a.skipRemoteNode != b.skipRemoteNode ||
    a.skipPrometheusApp != b.skipPrometheusApp
  )
    return false;

  const aEntries = (a.filters || []).reduce((acc, f) => {
    acc.add(f.toString());
    return acc;
  }, new Set());

  const bEntries = (b.filters || []).reduce((acc, f) => {
    acc.add(f.toString());
    return acc;
  }, new Set());

  if (aEntries.size !== bEntries.size) return false;

  for (const f of aEntries) {
    if (!bEntries.has(f)) return false;
  }

  return true;
};

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
  filters.filters?.forEach((ff: FlowsFilterEntry) => {
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
  filters.filters?.forEach((ff: FlowsFilterEntry) => {
    const passed = filterLinkUsingBasicEntry(link, ff);

    ok = ok && passed;
  });

  return ok;
};

export const filterService = (svc: ServiceCard, filters: Filters): boolean => {
  if (filters.skipHost && svc.isHost) return false;
  if (filters.skipKubeDns && svc.isKubeDNS) return false;
  if (filters.skipRemoteNode && svc.isRemoteNode) return false;
  if (filters.skipRemoteNode && svc.isPrometheusApp) return false;

  let ok = true;
  filters.filters?.forEach((ff: FlowsFilterEntry) => {
    const passed = filterServiceUsingBasicEntry(svc.service, ff);

    ok = ok && passed;
  });

  return ok;
};

export const filterServiceUsingBasicEntry = (
  service: Service,
  e: FlowsFilterEntry,
): boolean => {
  if (e.isIdentity) return service.id === e.query;

  if (e.isLabel) {
    const labels = service.labels.map(kv => `${kv.key}=${kv.value}`);
    return labels.includes(e.query);
  }

  if (e.isDNS) {
    return service.dnsNames.includes(e.query) || service.id === e.query;
  }

  return true;
};

export const filterLinkUsingBasicEntry = (
  l: Link,
  e: FlowsFilterEntry,
): boolean => {
  const sourceIdentityMatch = l.sourceId === e.query;
  const destIdentityMatch = l.destinationId === e.query;

  switch (e.direction) {
    case FlowsFilterDirection.Both: {
      switch (e.kind) {
        case FlowsFilterKind.Identity: {
          if (!sourceIdentityMatch && !destIdentityMatch) return false;
          break;
        }
      }
      break;
    }
    case FlowsFilterDirection.To: {
      switch (e.kind) {
        case FlowsFilterKind.Identity: {
          if (!destIdentityMatch) return false;
          break;
        }
      }
      break;
    }
    case FlowsFilterDirection.From: {
      switch (e.kind) {
        case FlowsFilterKind.Identity: {
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
  filter: FlowsFilterEntry,
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
    case FlowsFilterDirection.Both: {
      switch (filter.kind) {
        case FlowsFilterKind.Label: {
          if (!sourceLabelMatch && !destLabelMatch) return false;
          break;
        }
        case FlowsFilterKind.Ip: {
          if (
            flow.sourceIp !== filter.query &&
            flow.destinationIp !== filter.query
          ) {
            return false;
          }
          break;
        }
        case FlowsFilterKind.Dns: {
          if (!sourceDnsMatch && !destDnsMatch) return false;
          break;
        }
        case FlowsFilterKind.Identity: {
          if (!sourceIdentityMatch && !destIdentityMatch) return false;
          break;
        }
        case FlowsFilterKind.TCPFlag: {
          if (!tcpFlagMatch) return false;
          break;
        }
        case FlowsFilterKind.Pod: {
          if (!sourcePodMatch && !destPodMatch) return false;
          break;
        }
      }
      break;
    }
    case FlowsFilterDirection.From: {
      switch (filter.kind) {
        case FlowsFilterKind.Label: {
          if (!sourceLabelMatch) return false;
          break;
        }
        case FlowsFilterKind.Ip: {
          if (flow.sourceIp !== filter.query) return false;
          break;
        }
        case FlowsFilterKind.Dns: {
          if (!sourceDnsMatch) return false;
          break;
        }
        case FlowsFilterKind.Identity: {
          if (!sourceIdentityMatch) return false;
          break;
        }
        case FlowsFilterKind.TCPFlag: {
          if (!tcpFlagMatch) return false;
          break;
        }
        case FlowsFilterKind.Pod: {
          if (!sourcePodMatch) return false;
          break;
        }
      }
      break;
    }
    case FlowsFilterDirection.To: {
      switch (filter.kind) {
        case FlowsFilterKind.Label: {
          if (!destLabelMatch) return false;
          break;
        }
        case FlowsFilterKind.Ip: {
          if (flow.destinationIp !== filter.query) return false;
          break;
        }
        case FlowsFilterKind.Dns: {
          if (!destDnsMatch) return false;
          break;
        }
        case FlowsFilterKind.Identity: {
          if (!destIdentityMatch) return false;
          break;
        }
        case FlowsFilterKind.TCPFlag: {
          if (!tcpFlagMatch) return false;
          break;
        }
        case FlowsFilterKind.Pod: {
          if (!destPodMatch) return false;
          break;
        }
      }
      break;
    }
  }

  return true;
};
