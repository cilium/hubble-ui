import { ServiceCard } from '~/domain/service-map';
import { Labels } from '~/domain/labels';

import { Filters } from './filters';
import { FilterEntry } from './filter-entry';

export const filterService = (svc: ServiceCard, filters: Filters): boolean => {
  if (filters.skipHost && svc.isHost) return false;
  if (filters.skipRemoteNode && svc.isRemoteNode) return false;
  if (filters.skipPrometheusApp && svc.isPrometheusApp) return false;
  if (filters.skipKubeApiServer && svc.isKubeApiServer) return false;

  return true;
};

export const filterServiceByEntry = (
  card: ServiceCard,
  e: FilterEntry,
): boolean => {
  const service = card.service;
  let pass = true;
  if (e.isIdentity) pass = service.id === e.query;

  if (e.isLabel) {
    pass = !!Labels.findKVByString(service.labels, e.query);
  }

  if (e.isDNS) {
    pass = service.dnsNames.includes(e.query) || service.id === e.query;
  }

  if (e.isPort) {
    const portNum = parseInt(e.query, 10);
    if (!Number.isNaN(portNum)) {
      pass = Array.from(card.accessPoints.values()).some(
        ap => ap.port === portNum,
      );
    } else {
      pass = false;
    }
  }

  return e.negative !== pass;
};
