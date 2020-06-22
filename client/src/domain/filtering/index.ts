import {
  FlowsFilterEntry,
  FlowsFilterKind,
  FlowsFilterDirection,
  HubbleFlow,
  Flow,
  Verdict,
} from '~/domain/flows';

import { Link } from '~/domain/service-map';

export interface Filters {
  namespace?: string | null;
  verdict?: Verdict | null;
  httpStatus?: string | null;
  filters?: FlowsFilterEntry[];
}

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
    if (`${flow.httpStatus}` !== filters.httpStatus) return false;
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
  f: Flow,
  e: FlowsFilterEntry,
): boolean => {
  const [k, v] = e.labelKeyValue;
  const sourceLabelMatch = !!f.sourceLabels.find(l => l.key === k);
  const destLabelMatch = !!f.destinationLabels.find(l => l.key === k);

  const sourceDnsMatch = f.sourceNamesList.includes(e.query);
  const destDnsMatch = f.destinationNamesList.includes(e.query);

  const sourceIdentityMatch = f.sourceIdentity === +e.query;
  const destIdentityMatch = f.destinationIdentity === +e.query;

  switch (e.direction) {
    case FlowsFilterDirection.Both: {
      switch (e.kind) {
        case FlowsFilterKind.Label: {
          if (!sourceLabelMatch && !destLabelMatch) return false;
          break;
        }
        case FlowsFilterKind.Ip: {
          if (f.sourceIp !== e.query && f.destinationIp !== e.query) {
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
      }
      break;
    }
    case FlowsFilterDirection.From: {
      switch (e.kind) {
        case FlowsFilterKind.Label: {
          if (!sourceLabelMatch) return false;
          break;
        }
        case FlowsFilterKind.Ip: {
          if (f.sourceIp !== e.query) return false;
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
      }
      break;
    }
    case FlowsFilterDirection.To: {
      switch (e.kind) {
        case FlowsFilterKind.Label: {
          if (!destLabelMatch) return false;
          break;
        }
        case FlowsFilterKind.Ip: {
          if (f.destinationIp !== e.query) return false;
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
      }
      break;
    }
  }

  return true;
};
