import {
  Filters,
  FiltersObject,
  FiltersDiff,
  diffFilters,
  FilterEntry,
  FiltersKey,
} from '~/domain/filtering';
import { Verdict } from '~/domain/hubble';

import { filterEntries } from '~/testing/data';

const testFieldsDiff = (testName: string, fobj: FiltersObject) => {
  const lhs = Filters.default();
  const rhs = lhs.clone();

  Object.keys(fobj).forEach((key: string) => {
    (rhs as any)[key] = (fobj as any)[key];
  });

  const diff = diffFilters(lhs, rhs);

  const otherFields: FiltersKey[] = [
    'namespace',
    'verdict',
    'httpStatus',
    'filters',
    'skipHost',
    'skipKubeDns',
    'skipRemoteNode',
    'skipPrometheusApp',
  ];

  test(testName, () => {
    Object.keys(fobj).forEach((key: string) => {
      otherFields.splice(otherFields.indexOf(key as FiltersKey), 1);

      const keyChange = diff.changeOf(key as FiltersKey);
      expect(keyChange.changed).toBe(true);

      if (key !== 'filters') {
        expect(keyChange.added).toEqual([(fobj as any)[key]]);
      } else {
        expect(keyChange.added).toEqual((fobj as any)[key]);
      }
    });

    otherFields.forEach((key: string) => {
      const keyChange = diff.changeOf(key as FiltersKey);

      expect(keyChange.changed).toEqual(false);
    });
  });
};

describe('sanity check', () => {
  test('test 1 - empty', () => {
    const diff = FiltersDiff.empty();

    expect(diff.isEmpty).toBe(true);
    expect(diff.namespace.changed).toBe(false);
    expect(diff.verdict.changed).toBe(false);
    expect(diff.httpStatus.changed).toBe(false);
    expect(diff.filters.changed).toBe(false);
    expect(diff.skipHost.changed).toBe(false);
    expect(diff.skipKubeDns.changed).toBe(false);
    expect(diff.skipRemoteNode.changed).toBe(false);
    expect(diff.skipPrometheusApp.changed).toBe(false);
  });
});

describe('diffFilters', () => {
  test('test 1 - null / null', () => {
    const diff = diffFilters(null, null);

    expect(diff.isEmpty).toBe(true);
    expect(diff.namespace.changed).toBe(false);
    expect(diff.verdict.changed).toBe(false);
    expect(diff.httpStatus.changed).toBe(false);
    expect(diff.filters.changed).toBe(false);
    expect(diff.skipHost.changed).toBe(false);
    expect(diff.skipKubeDns.changed).toBe(false);
    expect(diff.skipRemoteNode.changed).toBe(false);
    expect(diff.skipPrometheusApp.changed).toBe(false);
  });

  test('test 2 - null / default filters', () => {
    const diff = diffFilters(null, Filters.default());

    expect(diff.isEmpty).toBe(false);
  });

  test('test 3 - default filters / null', () => {
    const diff = diffFilters(Filters.default(), null);

    expect(diff.isEmpty).toBe(false);
  });

  test('test 4 - default filters / default filters', () => {
    const diff = diffFilters(Filters.default(), Filters.default());

    expect(diff.isEmpty).toBe(true);
  });

  testFieldsDiff('test 5 - namespace is changed', {
    namespace: 'random-namespace',
  });

  testFieldsDiff('test 6 - verdict is changed', {
    verdict: Verdict.Forwarded,
  });

  testFieldsDiff('test 7 - httpStatus is changed', {
    httpStatus: '200',
  });

  testFieldsDiff('test 8 - filter entries is changed', {
    filters: [filterEntries.fromDnsGoogle!],
  });

  testFieldsDiff('test 9 - skipHost is changed', {
    skipHost: true,
  });

  testFieldsDiff('test 10 - skipKubeDns is changed', {
    skipKubeDns: true,
  });

  testFieldsDiff('test 11 - skipRemoteNode is changed', {
    skipRemoteNode: true,
  });

  testFieldsDiff('test 12 - skipPrometheusApp is changed', {
    skipPrometheusApp: true,
  });

  testFieldsDiff('test 13 - 2 fields changed', {
    namespace: 'random-namespace',
    verdict: Verdict.Forwarded,
  });

  testFieldsDiff('test 14 - 3 fields changed', {
    namespace: 'random-namespace',
    verdict: Verdict.Forwarded,
    httpStatus: '200',
  });

  testFieldsDiff('test 15 - 4 fields changed', {
    namespace: 'random-namespace',
    verdict: Verdict.Forwarded,
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
  });

  testFieldsDiff('test 16 - 5 fields changed', {
    namespace: 'random-namespace',
    verdict: Verdict.Forwarded,
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
  });

  testFieldsDiff('test 17 - 6 fields changed', {
    namespace: 'random-namespace',
    verdict: Verdict.Forwarded,
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
    skipKubeDns: true,
  });

  testFieldsDiff('test 18 - 7 fields changed', {
    namespace: 'random-namespace',
    verdict: Verdict.Forwarded,
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
    skipKubeDns: true,
    skipRemoteNode: true,
  });

  testFieldsDiff('test 19 - 8 fields changed', {
    namespace: 'random-namespace',
    verdict: Verdict.Forwarded,
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
    skipKubeDns: true,
    skipRemoteNode: true,
    skipPrometheusApp: true,
  });
});
