import { Verdict } from '~/domain/flows';
import { Diff, IDiff } from '~/domain/diff';
import { FilterEntry } from './filter-entry';
import { Filters } from './filters';

export class FiltersDiff implements IDiff<Filters> {
  public static fromFilters(f?: Filters | null): FiltersDiff {
    return new FiltersDiff(
      Diff.new(f?.namespace),
      Diff.new(f?.verdict),
      Diff.new(f?.httpStatus),
      Diff.new(f?.filters).setComparator(FiltersDiff.filterEntriesEqual),
      Diff.new(f?.skipHost),
      Diff.new(f?.skipKubeDns),
      Diff.new(f?.skipRemoteNode),
      Diff.new(f?.skipPrometheusApp),
    );
  }

  public static new(lhs?: Filters | null, rhs?: Filters | null): FiltersDiff {
    const diff = FiltersDiff.fromFilters(lhs);

    diff.namespace.step(rhs?.namespace);
    diff.verdict.step(rhs?.verdict);
    diff.httpStatus.step(rhs?.httpStatus);
    diff.filters.step(rhs?.filters);
    diff.skipHost.step(rhs?.skipHost);
    diff.skipKubeDns.step(rhs?.skipKubeDns);
    diff.skipRemoteNode.step(rhs?.skipRemoteNode);
    diff.skipPrometheusApp.step(rhs?.skipPrometheusApp);

    return diff;
  }

  public static newUnchanged(): FiltersDiff {
    return FiltersDiff.new(null, null);
  }

  private static filterEntriesEqual(
    lhs?: FilterEntry[] | null,
    rhs?: FilterEntry[] | null,
  ): boolean {
    // NOTE: if both of them are empty or null
    if (!lhs?.length && !rhs?.length) return true;

    // NOTE: if one of them are empty or null
    if (!lhs?.length || !rhs?.length) return false;

    const lhsFingerprints: Set<string> = new Set();
    const rhsFingerprints: Set<string> = new Set();

    lhs.forEach(fe => {
      lhsFingerprints.add(fe.toString());
    });

    rhs.forEach(fe => {
      rhsFingerprints.add(fe.toString());
    });

    if (lhsFingerprints.size !== rhsFingerprints.size) return false;

    for (const key of lhsFingerprints) {
      if (!rhsFingerprints.has(key)) return false;
    }

    return true;
  }

  constructor(
    public namespace: Diff<string>,
    public verdict: Diff<Verdict>,
    public httpStatus: Diff<string>,
    public filters: Diff<FilterEntry[]>,
    public skipHost: Diff<boolean>,
    public skipKubeDns: Diff<boolean>,
    public skipRemoteNode: Diff<boolean>,
    public skipPrometheusApp: Diff<boolean>,
  ) {}

  public invert(): this {
    this.namespace.invert();
    this.verdict.invert();
    this.httpStatus.invert();
    this.filters.invert();
    this.skipHost.invert();
    this.skipKubeDns.invert();
    this.skipRemoteNode.invert();
    this.skipPrometheusApp.invert();

    return this;
  }

  public get changed() {
    return (
      this.namespace.changed ||
      this.verdict.changed ||
      this.httpStatus.changed ||
      this.filters.changed ||
      this.skipHost.changed ||
      this.skipKubeDns.changed ||
      this.skipRemoteNode.changed ||
      this.skipPrometheusApp.changed
    );
  }

  public get podFiltersChanged(): boolean {
    const before = this.filters.before?.filter(f => f.isPod);
    const after = this.filters.after?.filter(f => f.isPod);

    return !FiltersDiff.filterEntriesEqual(before, after);
  }

  public get nothingChanged(): boolean {
    return !this.changed;
  }
}
