import { Verdict } from '~/domain/flows';
import { FilterEntry } from './filter-entry';
import { FiltersDiff } from './filters-diff';

const assignFilterProps = (to: FiltersObject, from: FiltersObject) => {
  Object.assign(to, {
    namespace: from.namespace,
    verdict: from.verdict,
    httpStatus: from.httpStatus,
    filters: from.filters,
    skipHost: from.skipHost,
    skipKubeDns: from.skipKubeDns,
    skipRemoteNode: from.skipRemoteNode,
    skipPrometheusApp: from.skipPrometheusApp,
    skipKubeApiServer: from.skipKubeApiServer,
  });

  return to;
};

export interface FiltersObject {
  namespace?: string | null;
  verdict?: Verdict | null;
  httpStatus?: string | null;
  filters?: FilterEntry[];
  skipHost?: boolean;
  skipKubeDns?: boolean;
  skipRemoteNode?: boolean;
  skipPrometheusApp?: boolean;
  skipKubeApiServer?: boolean;
}

export type FiltersKey = keyof FiltersObject;

const defaultFilters: FiltersObject = Object.freeze({
  namespace: null,
  verdict: null,
  httpStatus: null,
  filters: [],
  skipHost: false,
  skipKubeDns: false,
  skipRemoteNode: false,
  skipPrometheusApp: false,
  skipKubeApiServer: false,
});

export class Filters implements FiltersObject {
  public namespace?: string | null;
  public verdict?: Verdict | null;
  public httpStatus?: string | null;
  public filters?: FilterEntry[];
  public skipHost?: boolean;
  public skipKubeDns?: boolean;
  public skipRemoteNode?: boolean;
  public skipPrometheusApp?: boolean;
  public skipKubeApiServer?: boolean;

  public static fromObject(obj: FiltersObject): Filters {
    return new Filters(obj);
  }

  public static defaultObject(): FiltersObject {
    return defaultFilters;
  }

  public static default(): Filters {
    return new Filters(defaultFilters);
  }

  public diff(rhs?: Filters | null): FiltersDiff {
    if (rhs == null) return FiltersDiff.fromFilters(this).invert();

    return FiltersDiff.new(this, rhs);
  }

  constructor(obj: FiltersObject) {
    assignFilterProps(this, obj);
  }

  public setNamespace(ns: string | null) {
    this.namespace = ns;

    return this;
  }

  public toPlainObject(): FiltersObject {
    return assignFilterProps({} as FiltersObject, this);
  }

  public equals(rhs: FiltersObject): boolean {
    if (
      this.namespace != rhs.namespace ||
      this.verdict != rhs.verdict ||
      this.httpStatus != rhs.httpStatus ||
      this.skipHost != rhs.skipHost ||
      this.skipKubeDns != rhs.skipKubeDns ||
      this.skipRemoteNode != rhs.skipRemoteNode ||
      this.skipPrometheusApp != rhs.skipPrometheusApp ||
      this.skipKubeApiServer != rhs.skipKubeApiServer
    ) {
      return false;
    }

    const aEntries = (this.filters || []).reduce((acc, f) => {
      acc.add(f.toString());
      return acc;
    }, new Set());

    const bEntries = (rhs.filters || []).reduce((acc, f) => {
      acc.add(f.toString());
      return acc;
    }, new Set());

    if (aEntries.size !== bEntries.size) return false;

    for (const f of aEntries) {
      if (!bEntries.has(f)) return false;
    }

    return true;
  }

  public clone(deep = false): Filters {
    const shallowObj: FiltersObject = this.toPlainObject();

    if (deep) {
      shallowObj.filters = (shallowObj.filters || []).map(f => f.clone());
    }

    return Filters.fromObject(shallowObj);
  }
}
