import { Link, Service, ServiceCard } from '~/domain/service-map';
import { Labels } from '~/domain/labels';
import * as dhelpers from '~/domain/helpers';

import { Filters } from './filters';
import { FilterEntry } from './filter-entry';

export const filterService = (svc: ServiceCard, filters: Filters): boolean => {
  if (filters.skipHost && svc.isHost) return false;
  if (filters.skipRemoteNode && svc.isRemoteNode) return false;
  if (filters.skipPrometheusApp && svc.isPrometheusApp) return false;
  return true;
};

export const filterServiceByEntry = (service: Service, e: FilterEntry): boolean => {
  let pass = true;
  if (e.isIdentity) return service.identity.toString() === e.query;

  if (e.isLabel) {
    pass = !!Labels.findKVByString(service.labels, e.query);
  }

  if (e.isDNS) {
    pass = service.dnsNames.includes(e.query) || service.id === e.query;
  }

  if (e.isWorkload) {
    const workload = e.asWorkload();
    if (workload != null) {
      pass = dhelpers.workload.includes(service.workloads, workload);
    }
  }

  return e.negative ? e.negative !== pass : pass;
};
