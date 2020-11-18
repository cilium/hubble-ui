import { Flow, Verdict } from '~/domain/flows';
import {
  FilterEntry,
  Kind as FilterKind,
  Direction as FilterDirection,
} from './filter-entry';

import { Filters } from '~/domain/filtering';

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

  if (!!filters.skipHost) {
    if (flow.sourceLabelProps.isHost || flow.destinationLabelProps.isHost) {
      return false;
    }
  }

  if (!!filters.skipRemoteNode) {
    const sourceIsRemoteNode = flow.sourceLabelProps.isRemoteNode;
    const destIsRemoteNode = flow.destinationLabelProps.isRemoteNode;

    if (sourceIsRemoteNode || destIsRemoteNode) return false;
  }

  if (!!filters.skipKubeDns) {
    if (flow.sourcePort === 53 || flow.destinationPort === 53) return false;
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

  let ok = !filters.filters?.length;
  filters.filters?.forEach((ff: FilterEntry) => {
    const passed = filterFlowByEntry(flow, ff);

    ok = ok || passed;
  });

  return ok;
};

export const filterFlowByEntry = (flow: Flow, filter: FilterEntry): boolean => {
  const [key, value] = filter.labelKeyValue;

  switch (filter.direction) {
    case FilterDirection.Both: {
      switch (filter.kind) {
        case FilterKind.Label: {
          const sourceLabelMatch = flow.sourceLabels.some(
            label => label.key === key && label.value === value,
          );
          const destLabelMatch = flow.destinationLabels.some(
            label => label.key === key && label.value === value,
          );

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
          const sourceDnsMatch = flow.sourceNamesList.includes(filter.query);
          const destDnsMatch = flow.destinationNamesList.includes(filter.query);

          if (!sourceDnsMatch && !destDnsMatch) return false;
          break;
        }
        case FilterKind.Identity: {
          const sourceIdentityMatch = flow.sourceIdentity === +filter.query;
          const destIdentityMatch = flow.destinationIdentity === +filter.query;

          if (!sourceIdentityMatch && !destIdentityMatch) return false;
          break;
        }
        case FilterKind.TCPFlag: {
          const tcpFlagMatch = flow.enabledTcpFlags.includes(
            filter.query as any,
          );

          if (!tcpFlagMatch) return false;
          break;
        }
        case FilterKind.Pod: {
          const sourcePodMatch = flow.sourcePodName === filter.query;
          const destPodMatch = flow.destinationPodName === filter.query;

          if (!sourcePodMatch && !destPodMatch) return false;
          break;
        }
      }
      break;
    }
    case FilterDirection.From: {
      switch (filter.kind) {
        case FilterKind.Label: {
          const sourceLabelMatch = flow.sourceLabels.some(
            label => label.key === key && label.value === value,
          );

          if (!sourceLabelMatch) return false;
          break;
        }
        case FilterKind.Ip: {
          if (flow.sourceIp !== filter.query) return false;
          break;
        }
        case FilterKind.Dns: {
          const sourceDnsMatch = flow.sourceNamesList.includes(filter.query);
          if (!sourceDnsMatch) return false;
          break;
        }
        case FilterKind.Identity: {
          const sourceIdentityMatch = flow.sourceIdentity === +filter.query;
          if (!sourceIdentityMatch) return false;
          break;
        }
        case FilterKind.TCPFlag: {
          const tcpFlagMatch = flow.enabledTcpFlags.includes(
            filter.query as any,
          );
          if (!tcpFlagMatch) return false;
          break;
        }
        case FilterKind.Pod: {
          const sourcePodMatch = flow.sourcePodName === filter.query;
          if (!sourcePodMatch) return false;
          break;
        }
      }
      break;
    }
    case FilterDirection.To: {
      switch (filter.kind) {
        case FilterKind.Label: {
          const destLabelMatch = flow.destinationLabels.some(
            label => label.key === key && label.value === value,
          );
          if (!destLabelMatch) return false;
          break;
        }
        case FilterKind.Ip: {
          if (flow.destinationIp !== filter.query) return false;
          break;
        }
        case FilterKind.Dns: {
          const destDnsMatch = flow.destinationNamesList.includes(filter.query);
          if (!destDnsMatch) return false;
          break;
        }
        case FilterKind.Identity: {
          const destIdentityMatch = flow.destinationIdentity === +filter.query;
          if (!destIdentityMatch) return false;
          break;
        }
        case FilterKind.TCPFlag: {
          const tcpFlagMatch = flow.enabledTcpFlags.includes(
            filter.query as any,
          );
          if (!tcpFlagMatch) return false;
          break;
        }
        case FilterKind.Pod: {
          const destPodMatch = flow.destinationPodName === filter.query;

          if (!destPodMatch) return false;
          break;
        }
      }
      break;
    }
  }

  return true;
};
