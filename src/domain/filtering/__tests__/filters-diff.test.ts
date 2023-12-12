import { Filters, FiltersObject, FiltersDiff, FiltersKey } from '~/domain/filtering';
import { Verdict } from '~/domain/hubble';

import { filterEntries } from '~/testing/data';

const testFieldsDiff = (testName: string, fobj: Partial<FiltersObject>) => {
  const lhs = Filters.default();
  const rhs = lhs.clone();

  Object.keys(fobj).forEach((key: string) => {
    (rhs as any)[key] = (fobj as any)[key];
  });

  const diff = FiltersDiff.new(lhs, rhs);

  const otherFields: FiltersKey[] = [
    'namespace',
    'verdicts',
    'httpStatus',
    'filters',
    'skipHost',
    'skipKubeDns',
    'skipRemoteNode',
    'skipPrometheusApp',
  ];

  test(testName, () => {
    Object.keys(fobj).forEach((key: string) => {
      const fkey: keyof FiltersObject = key as keyof FiltersObject;
      otherFields.splice(otherFields.indexOf(key as FiltersKey), 1);

      const keyChange = diff[fkey];
      expect(keyChange.changed).toBe(true);

      // if (key === 'filters') {
      //   expect(keyChange.after).toEqual((fobj as any)[key]);
      // } else {
      //   expect(keyChange.after).toEqual([(fobj as any)[key]]);
      // }
    });

    otherFields.forEach((key: string) => {
      const fkey: keyof FiltersObject = key as keyof FiltersObject;
      const keyChange = diff[fkey];

      expect(keyChange.changed).toEqual(false);
    });
  });
};

describe('sanity check', () => {
  test('test 1 - empty', () => {
    const diff = FiltersDiff.newUnchanged();

    expect(diff.nothingChanged).toBe(true);
    expect(diff.namespace.changed).toBe(false);
    expect(diff.verdicts.changed).toBe(false);
    expect(diff.httpStatus.changed).toBe(false);
    expect(diff.filters.changed).toBe(false);
    expect(diff.skipHost.changed).toBe(false);
    expect(diff.skipKubeDns.changed).toBe(false);
    expect(diff.skipRemoteNode.changed).toBe(false);
    expect(diff.skipPrometheusApp.changed).toBe(false);
  });
});

describe('FiltersDiff', () => {
  test('test 1 - null / null', () => {
    const diff = FiltersDiff.new(null, null);

    expect(diff.nothingChanged).toBe(true);
    expect(diff.namespace.changed).toBe(false);
    expect(diff.verdicts.changed).toBe(false);
    expect(diff.httpStatus.changed).toBe(false);
    expect(diff.filters.changed).toBe(false);
    expect(diff.skipHost.changed).toBe(false);
    expect(diff.skipKubeDns.changed).toBe(false);
    expect(diff.skipRemoteNode.changed).toBe(false);
    expect(diff.skipPrometheusApp.changed).toBe(false);
  });

  test('test 2 - null / default filters', () => {
    const diff = FiltersDiff.new(null, Filters.default());

    expect(diff.nothingChanged).toBe(false);
  });

  test('test 3 - default filters / null', () => {
    const diff = FiltersDiff.new(Filters.default(), null);

    expect(diff.nothingChanged).toBe(false);
  });

  test('test 4 - default filters / default filters', () => {
    const diff = FiltersDiff.new(Filters.default(), Filters.default());

    expect(diff.nothingChanged).toBe(true);
  });

  testFieldsDiff('test 5 - namespace is changed', {
    namespace: 'random-namespace',
  });

  testFieldsDiff('test 6 - verdict is changed', {
    verdicts: new Set([Verdict.Forwarded]),
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

  testFieldsDiff('test 14 - 2 fields changed', {
    namespace: 'random-namespace',
    verdicts: new Set([Verdict.Forwarded]),
  });

  testFieldsDiff('test 15 - 3 fields changed', {
    namespace: 'random-namespace',
    verdicts: new Set([Verdict.Forwarded]),
    httpStatus: '200',
  });

  testFieldsDiff('test 16 - 4 fields changed', {
    namespace: 'random-namespace',
    verdicts: new Set([Verdict.Forwarded]),
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
  });

  testFieldsDiff('test 17 - 5 fields changed', {
    namespace: 'random-namespace',
    verdicts: new Set([Verdict.Forwarded]),
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
  });

  testFieldsDiff('test 18 - 6 fields changed', {
    namespace: 'random-namespace',
    verdicts: new Set([Verdict.Forwarded]),
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
    skipKubeDns: true,
  });

  testFieldsDiff('test 19 - 7 fields changed', {
    namespace: 'random-namespace',
    verdicts: new Set([Verdict.Forwarded]),
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
    skipKubeDns: true,
    skipRemoteNode: true,
  });

  testFieldsDiff('test 20 - 8 fields changed', {
    namespace: 'random-namespace',
    verdicts: new Set([Verdict.Forwarded]),
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
    skipKubeDns: true,
    skipRemoteNode: true,
    skipPrometheusApp: true,
  });

  testFieldsDiff('test 21 - 9 fields changed', {
    namespace: 'random-namespace',
    verdicts: new Set([Verdict.Forwarded]),
    httpStatus: '200',
    filters: [filterEntries.fromDnsGoogle!],
    skipHost: true,
    skipKubeDns: true,
    skipRemoteNode: true,
    skipPrometheusApp: true,
  });
});
