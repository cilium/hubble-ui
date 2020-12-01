import { Verdict } from '~/domain/flows';
import { FilterEntry } from './filter-entry';
import { Filters, FiltersKey } from './filters';

export type Change<T> = {
  changed: boolean;
  added: T[];
  deleted: T[];
};

const change = <T>(changed: boolean, added: T[], deleted: T[]): Change<T> => {
  return { changed, added, deleted };
};

const cloneChange = <T>(ch: Change<T>): Change<T> => {
  return {
    changed: ch.changed,
    added: ch.added.slice(),
    deleted: ch.deleted.slice(),
  };
};

const revertChange = <T>(ch: Change<T>) => {
  ch.changed = true;
  [ch.added, ch.deleted] = [ch.deleted, ch.deleted];
};

export class FiltersDiff {
  public namespace: Change<string | null | undefined>;
  public verdict: Change<Verdict | null | undefined>;
  public httpStatus: Change<string | null | undefined>;
  public filters: Change<FilterEntry>;
  public skipHost: Change<boolean | null | undefined>;
  public skipKubeDns: Change<boolean | null | undefined>;
  public skipRemoteNode: Change<boolean | null | undefined>;
  public skipPrometheusApp: Change<boolean | null | undefined>;

  public static empty(): FiltersDiff {
    return new FiltersDiff(false);
  }

  public static fromFilters(filters: Filters): FiltersDiff {
    const diff = new FiltersDiff(true);

    diff.namespace.added = [filters.namespace];
    diff.verdict.added = [filters.verdict];
    diff.httpStatus.added = [filters.httpStatus];
    diff.filters.added = filters.filters || [];
    diff.skipHost.added = [filters.skipHost];
    diff.skipKubeDns.added = [filters.skipKubeDns];
    diff.skipRemoteNode.added = [filters.skipRemoteNode];
    diff.skipPrometheusApp.added = [filters.skipPrometheusApp];

    return diff;
  }

  constructor(changed = false) {
    this.namespace = change(changed, [], []);
    this.verdict = change(changed, [], []);
    this.httpStatus = change(changed, [], []);
    this.filters = change(changed, [], []);
    this.skipHost = change(changed, [], []);
    this.skipKubeDns = change(changed, [], []);
    this.skipRemoteNode = change(changed, [], []);
    this.skipPrometheusApp = change(changed, [], []);
  }

  public clone(): FiltersDiff {
    const diff = new FiltersDiff();

    diff.namespace = cloneChange(this.namespace);
    diff.verdict = cloneChange(this.verdict);
    diff.httpStatus = cloneChange(this.httpStatus);
    diff.filters = cloneChange(this.filters);
    diff.skipHost = cloneChange(this.skipHost);
    diff.skipKubeDns = cloneChange(this.skipKubeDns);
    diff.skipRemoteNode = cloneChange(this.skipRemoteNode);
    diff.skipPrometheusApp = cloneChange(this.skipPrometheusApp);

    return diff;
  }

  public revert(): FiltersDiff {
    const diff = this.clone();

    revertChange(this.namespace);
    revertChange(this.verdict);
    revertChange(this.httpStatus);
    revertChange(this.filters);
    revertChange(this.skipHost);
    revertChange(this.skipKubeDns);
    revertChange(this.skipRemoteNode);
    revertChange(this.skipPrometheusApp);

    return diff;
  }

  public changeOf(key: FiltersKey): Change<any> {
    switch (key) {
      case 'namespace':
        return this.namespace;
      case 'verdict':
        return this.verdict;
      case 'httpStatus':
        return this.httpStatus;
      case 'filters':
        return this.filters;
      case 'skipHost':
        return this.skipHost;
      case 'skipKubeDns':
        return this.skipKubeDns;
      case 'skipRemoteNode':
        return this.skipRemoteNode;
      case 'skipPrometheusApp':
        return this.skipPrometheusApp;
    }
  }

  public get podFiltersChanged(): boolean {
    const added = !!this.filters.added?.some(f => f.isPod);
    const deleted = !!this.filters.deleted?.some(f => f.isPod);

    return added || deleted;
  }

  public get nothingChanged(): boolean {
    return this.isEmpty;
  }

  public get isEmpty(): boolean {
    return (
      !this.namespace.changed &&
      !this.verdict.changed &&
      !this.httpStatus.changed &&
      !this.filters.changed &&
      !this.skipHost.changed &&
      !this.skipKubeDns.changed &&
      !this.skipRemoteNode.changed &&
      !this.skipPrometheusApp.changed
    );
  }
}

// NOTE: diff is not commutative
export const diffFilters = (
  lhs?: Filters | null,
  rhs?: Filters | null,
): FiltersDiff => {
  if (lhs == null && rhs == null) {
    return FiltersDiff.empty();
  } else if (lhs == null) {
    // NOTE: changed from null filters to rhs filters
    return FiltersDiff.fromFilters(rhs!);
  } else if (rhs == null) {
    // NOTE: changed from lhs filters to null filters (empty filters)
    return FiltersDiff.fromFilters(lhs!).revert();
  }

  const diff = new FiltersDiff();
  diff.namespace.changed = rhs.namespace !== lhs.namespace;
  diff.namespace.added = [rhs.namespace];
  diff.namespace.deleted = [lhs.namespace];

  diff.verdict.changed = rhs.verdict !== lhs.verdict;
  diff.verdict.added = [rhs.verdict];
  diff.verdict.deleted = [lhs.verdict];

  diff.httpStatus.changed = rhs.httpStatus !== lhs.httpStatus;
  diff.httpStatus.added = [rhs.httpStatus];
  diff.httpStatus.deleted = [lhs.httpStatus];

  const [feAdded, feDeleted] = diffFilterEntries(
    lhs.filters || [],
    rhs.filters || [],
  );
  diff.filters.added = feAdded;
  diff.filters.deleted = feDeleted;
  diff.filters.changed = feAdded.length > 0 || feDeleted.length > 0;

  diff.skipHost.changed = rhs.skipHost !== lhs.skipHost;
  diff.skipHost.added = [rhs.skipHost];
  diff.skipHost.deleted = [lhs.skipHost];

  diff.skipKubeDns.changed = rhs.skipKubeDns !== lhs.skipKubeDns;
  diff.skipKubeDns.added = [rhs.skipKubeDns];
  diff.skipKubeDns.deleted = [lhs.skipKubeDns];

  diff.skipRemoteNode.changed = rhs.skipRemoteNode !== lhs.skipRemoteNode;
  diff.skipRemoteNode.added = [rhs.skipRemoteNode];
  diff.skipRemoteNode.deleted = [lhs.skipRemoteNode];

  diff.skipPrometheusApp.changed =
    rhs.skipPrometheusApp !== lhs.skipPrometheusApp;
  diff.skipPrometheusApp.added = [rhs.skipPrometheusApp];
  diff.skipPrometheusApp.deleted = [lhs.skipPrometheusApp];

  return diff;
};

const diffFilterEntries = (
  lhs: FilterEntry[],
  rhs: FilterEntry[],
): [FilterEntry[], FilterEntry[]] => {
  const lhsMap: Map<string, FilterEntry> = new Map();
  const rhsMap: Map<string, FilterEntry> = new Map();
  const added: FilterEntry[] = [];
  const deleted: FilterEntry[] = [];

  lhs.forEach(fe => {
    lhsMap.set(fe.toString(), fe);
  });

  rhs.forEach(fe => {
    rhsMap.set(fe.toString(), fe);
  });

  lhsMap.forEach((fe, key) => {
    if (rhsMap.has(key)) return;

    deleted.push(fe);
  });

  rhsMap.forEach((fe, key) => {
    if (lhsMap.has(key)) return;

    added.push(fe);
  });

  return [added, deleted];
};
