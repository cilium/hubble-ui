import { Verdict } from '~/domain/flows';

import { Diffable } from '~/domain/diff';

import { FilterEntry } from './filter-entry';
import { FiltersDiff } from './filters-diff';

const assignFilterProps = (to: FiltersObject, from: FiltersObject) => {
  Object.assign(to, {
    namespace: from.namespace,
    verdicts: from.verdicts,
    httpStatus: from.httpStatus,
    filters: from.filters,
    skipHost: from.skipHost,
    skipKubeDns: from.skipKubeDns,
    skipRemoteNode: from.skipRemoteNode,
    skipPrometheusApp: from.skipPrometheusApp,
  });

  return to;
};

export interface FiltersObject {
  namespace?: string | null;
  verdicts?: Set<Verdict>;
  httpStatus?: string | null;
  filters?: FilterEntry[];
  skipHost?: boolean;
  skipKubeDns?: boolean;
  skipRemoteNode?: boolean;
  skipPrometheusApp?: boolean;
}

export type FiltersKey = keyof FiltersObject;

export class Filters implements FiltersObject, Diffable<Filters, FiltersDiff> {
  public namespace?: string | null;
  public verdicts?: Set<Verdict>;
  public httpStatus?: string | null;
  public filters?: FilterEntry[];
  public skipHost?: boolean;
  public skipKubeDns?: boolean;
  public skipRemoteNode?: boolean;
  public skipPrometheusApp?: boolean;

  public static fromObject(obj: FiltersObject): Filters {
    return new Filters(obj);
  }

  public static defaultObject(): FiltersObject {
    return {
      namespace: null,
      verdicts: new Set(),
      httpStatus: null,
      filters: [],
      skipHost: false,
      skipKubeDns: false,
      skipRemoteNode: false,
      skipPrometheusApp: false,
    };
  }

  public static default(): Filters {
    return new Filters(Filters.defaultObject());
  }

  constructor(obj: FiltersObject) {
    assignFilterProps(this, obj);
  }

  public setNamespace(ns: string | null) {
    this.namespace = ns;

    return this;
  }

  public addFilterEntry(fe: FilterEntry) {
    if (this.filters == null) {
      this.filters = [];
    }

    this.filters.push(fe);
  }

  public toPlainObject(): FiltersObject {
    return assignFilterProps({} as FiltersObject, this);
  }

  // TODO: write tests for a new behavior regarding since/until fields
  public equals(rhs: FiltersObject): boolean {
    if (
      this.namespace != rhs.namespace ||
      this.httpStatus != rhs.httpStatus ||
      this.skipHost != rhs.skipHost ||
      this.skipKubeDns != rhs.skipKubeDns ||
      this.skipRemoteNode != rhs.skipRemoteNode ||
      this.skipPrometheusApp != rhs.skipPrometheusApp
    ) {
      return false;
    }

    const aVerdictsEntries = this.verdicts ?? new Set();
    const bVerdictsEntries = rhs.verdicts ?? new Set();
    if (aVerdictsEntries.size !== bVerdictsEntries.size) return false;
    for (const verdict of aVerdictsEntries) if (!bVerdictsEntries.has(verdict)) return false;

    const aFiltersEntries = (this.filters || []).reduce((acc, f) => {
      acc.add(f.toString());
      return acc;
    }, new Set<string>());

    const bFiltersEntries = (rhs.filters || []).reduce((acc, f) => {
      acc.add(f.toString());
      return acc;
    }, new Set<string>());

    if (aFiltersEntries.size !== bFiltersEntries.size) return false;

    for (const f of aFiltersEntries) {
      if (!bFiltersEntries.has(f)) return false;
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

  public diff(rhs?: Filters | null): FiltersDiff {
    if (rhs == null) return FiltersDiff.fromFilters(this).invert();

    return FiltersDiff.new(this, rhs);
  }
}
