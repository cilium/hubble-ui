import { Link, Service, ServiceCard } from '~/domain/service-map';
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
  service: Service,
  e: FilterEntry,
): boolean => {
  let pass = true;
  if (e.isIdentity) pass = service.id === e.query;

  if (e.isLabel) {
    pass = !!Labels.findKVByString(service.labels, e.query);
  }

  if (e.isDNS) {
    pass = service.dnsNames.includes(e.query) || service.id === e.query;
  }

  return e.negative !== pass;
};
