import { Labels } from '~/domain/labels';
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

  // NOTE: destination port 53 and apporpriate destination label are exactly
  // NOTE: how GetFlowsRequest is built now
  if (!!filters.skipKubeDns) {
    if (
      flow.sourcePort === 53 ||
      (flow.destinationPort === 53 && flow.destinationLabelProps.isKubeDNS)
    )
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

  let ok = !filters.filters?.length;
  filters.filters?.forEach((ff: FilterEntry) => {
    const passed = filterFlowByEntry(flow, ff);

    ok = ok || passed;
  });

  return ok;
};

export const filterFlowByEntry = (flow: Flow, filter: FilterEntry): boolean => {
  const [key, value] = filter.labelKeyValue;
  let [fromOk, toOk] = [false, false];

  switch (filter.kind) {
    case FilterKind.Label: {
      if (filter.fromRequired) fromOk = flow.senderHasLabelArray([key, value]);
      if (filter.toRequired) toOk = flow.receiverHasLabelArray([key, value]);

      break;
    }
    case FilterKind.Ip: {
      if (filter.fromRequired) fromOk = flow.senderHasIp(filter.query);
      if (filter.toRequired) toOk = flow.receiverHasIp(filter.query);

      break;
    }
    case FilterKind.Dns: {
      if (filter.fromRequired) fromOk = flow.senderHasDomain(filter.query);
      if (filter.toRequired) toOk = flow.receiverHasDomain(filter.query);

      break;
    }
    case FilterKind.Identity: {
      if (filter.fromRequired) fromOk = flow.senderHasIdentity(filter.query);
      if (filter.toRequired) toOk = flow.receiverHasIdentity(filter.query);

      break;
    }
    case FilterKind.TCPFlag: {
      return flow.hasTCPFlag(filter.query.toLowerCase() as any);
    }
    case FilterKind.Pod: {
      if (filter.fromRequired) fromOk = flow.senderPodIs(filter.query);
      if (filter.toRequired) toOk = flow.receiverPodIs(filter.query);

      break;
    }
  }

  return fromOk || toOk;
};
