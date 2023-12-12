import { Filters, FilterEntry } from '~/domain/filtering';
import { Verdict } from '~/domain/hubble';
import { Aggregation } from '~/domain/aggregation';

import * as combinations from '~/utils/iter-tools/combinations';

const nextElem = (idx: number, arr: any[]) => {
  return arr[(idx + 1) % arr.length];
};

const testNullAndUndefinedAreNotEqualToSmth = () => {
  const namespaces: Array<undefined | null | string> = [undefined, null, 'random'];

  const verdicts: Array<Set<Verdict> | undefined> = [undefined, new Set([Verdict.Forwarded])];

  const httpStatuses: Array<undefined | null | string> = [undefined, null, '200'];

  const filters: Array<undefined | FilterEntry[]> = [
    undefined,
    [FilterEntry.parse('from:ip=158.183.221.43')!],
  ];

  const skipHosts: Array<undefined | boolean> = [undefined, false, true];
  const skipKubeDnss: Array<undefined | boolean> = [undefined, false, true];
  const skipRemoteApps: Array<undefined | boolean> = [undefined, false, true];
  const skipPrometheusApps = [undefined, false, true];

  combinations
    .arrays([
      namespaces.length,
      verdicts.length,
      httpStatuses.length,
      filters.length,
      skipHosts.length,
      skipKubeDnss.length,
      skipRemoteApps.length,
      skipPrometheusApps.length,
    ])
    .forEach((indices: number[], idx: number) => {
      const [nsIdx, verdictIdx, hsIdx, filtersIdx, shIdx, skdIdx, skrIdx, skpaIdx] = indices;

      const aFilters: Filters = Filters.fromObject({
        namespace: namespaces[nsIdx],
        verdicts: verdicts[verdictIdx],
        httpStatus: httpStatuses[hsIdx],
        filters: filters[filtersIdx],
        skipHost: skipHosts[shIdx],
        skipKubeDns: skipKubeDnss[skdIdx],
        skipRemoteNode: skipRemoteApps[skrIdx],
        skipPrometheusApp: skipPrometheusApps[skpaIdx],
      });

      const bFilters: Filters = Filters.fromObject({
        namespace: nextElem(nsIdx, namespaces),
        verdicts: nextElem(verdictIdx, verdicts),
        httpStatus: nextElem(hsIdx, httpStatuses),
        filters: nextElem(filtersIdx, filters),
        skipHost: nextElem(shIdx, skipHosts),
        skipKubeDns: nextElem(skdIdx, skipKubeDnss),
        skipRemoteNode: nextElem(skrIdx, skipRemoteApps),
        skipPrometheusApp: nextElem(skpaIdx, skipPrometheusApps),
      });

      test(`testNullAndUndefinedAreNotEqualToSmth ${idx * 2 + 1} > self-equality`, () => {
        const sameFilters = aFilters.clone();
        expect(aFilters.equals(sameFilters)).toBe(true);
      });

      test(`testNullAndUndefinedAreNotEqualToSmth ${idx * 2 + 2} > inequality`, () => {
        expect(aFilters.equals(bFilters)).toBe(false);
      });
    });
};

const testCommonFiltersEquality = () => {
  const namespaces: Array<undefined | null | string> = ['random'];

  const verdicts: Array<Set<Verdict> | undefined> = [
    new Set([Verdict.Forwarded]),
    new Set([Verdict.Dropped]),
  ];

  const httpStatuses: Array<undefined | null | string> = ['200', '200+', '400'];

  const filters: Array<undefined | FilterEntry[]> = [
    [],
    [FilterEntry.parse('both:dns=google.com')!, FilterEntry.parse('from:ip=255.255.255.255')!],
    [
      FilterEntry.parse('to:label=k8s-app=core-api')!,
      FilterEntry.parse('from:label=k8s-app=crawler')!,
    ],
    [FilterEntry.parse('from:ip=158.183.221.43')!],
  ];

  const skipHosts: Array<undefined | boolean> = [false, true];
  const skipKubeDnss: Array<undefined | boolean> = [false, true];
  const skipRemoteApps: Array<undefined | boolean> = [false, true];
  const skipPrometheusApps = [false, true];
  const aggregations = [null, Aggregation.default()];

  combinations
    .arrays([
      namespaces.length,
      verdicts.length,
      httpStatuses.length,
      filters.length,
      skipHosts.length,
      skipKubeDnss.length,
      skipRemoteApps.length,
      skipPrometheusApps.length,
      aggregations.length,
    ])
    .forEach((indices: number[], idx: number) => {
      const [nsIdx, verdictIdx, hsIdx, filtersIdx, shIdx, skdIdx, skrIdx, skpaIdx] = indices;

      const aFilters: Filters = Filters.fromObject({
        namespace: namespaces[nsIdx],
        verdicts: verdicts[verdictIdx],
        httpStatus: httpStatuses[hsIdx],
        filters: filters[filtersIdx],
        skipHost: skipHosts[shIdx],
        skipKubeDns: skipKubeDnss[skdIdx],
        skipRemoteNode: skipRemoteApps[skrIdx],
        skipPrometheusApp: skipPrometheusApps[skpaIdx],
      });

      const bFilters: Filters = Filters.fromObject({
        namespace: nextElem(nsIdx, namespaces),
        verdicts: nextElem(verdictIdx, verdicts),
        httpStatus: nextElem(hsIdx, httpStatuses),
        filters: nextElem(filtersIdx, filters),
        skipHost: nextElem(shIdx, skipHosts),
        skipKubeDns: nextElem(skdIdx, skipKubeDnss),
        skipRemoteNode: nextElem(skrIdx, skipRemoteApps),
        skipPrometheusApp: nextElem(skpaIdx, skipPrometheusApps),
      });

      test(`test ${idx * 2 + 1} > self-equality`, () => {
        const sameFilters = aFilters.clone();
        expect(aFilters.equals(sameFilters)).toBe(true);
      });

      test(`test ${idx * 2 + 2} > inequality`, () => {
        expect(aFilters.equals(bFilters)).toBe(false);
      });
    });
};

describe('filters equality check tests', () => {
  testNullAndUndefinedAreNotEqualToSmth();
  testCommonFiltersEquality();
});
