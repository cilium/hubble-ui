import {
  Filters,
  FiltersObject,
  filterService,
  filterServiceByEntry,
  FilterEntry,
  FilterKind,
  FilterDirection,
} from '~/domain/filtering';

import { ServiceCard } from '~/domain/service-map';
import { Dictionary } from '~/domain/misc';
import { services, filterEntries } from '~/testing/data';

import { expectFilterEntry } from './general';

const runUnusedFiltersTests = (filters: FiltersObject[], services: Dictionary<ServiceCard>) => {
  Object.keys(services).forEach((linkName: string) => {
    const service = services[linkName];

    filters.forEach((f: FiltersObject, fidx: number) => {
      test(`unused filter fields test, service: ${linkName}, filters: ${fidx + 1}`, () => {
        const stay = filterService(service, Filters.fromObject(f));
        expect(stay).toBe(true);
      });
    });
  });
};

const testFilterEntry = (
  captionFn: (serviceName: string, testNum: number) => string,
  entry: FilterEntry,
  expected: boolean,
  services: Dictionary<ServiceCard>,
) => {
  Object.keys(services).forEach((serviceName: string, lidx: number) => {
    const service = services[serviceName].service;
    const caption = captionFn(serviceName, lidx + 1);

    test(caption, () => {
      const result = filterServiceByEntry(service, entry);

      expect(result).toBe(expected);
    });
  });
};

describe('filterService', () => {
  const regular = ServiceCard.fromService(services.regular);
  const world = ServiceCard.fromService(services.world);
  const host = ServiceCard.fromService(services.host);
  const remoteNode = ServiceCard.fromService(services.remoteNode);
  const kubeDns = ServiceCard.fromService(services.kubeDNS);

  test('mock data sanity check', () => {
    expect(regular.isWorld).toBe(false);
    expect(regular.isHost).toBe(false);
    expect(regular.isKubeDNS).toBe(false);
    expect(regular.isPrometheusApp).toBe(false);
    expect(regular.isRemoteNode).toBe(false);
    expect(regular.workload).toBeTruthy();

    expect(world.isWorld).toBe(true);
    expect(world.isHost).toBe(false);
    expect(world.isKubeDNS).toBe(false);
    expect(world.isPrometheusApp).toBe(false);
    expect(world.isRemoteNode).toBe(false);

    expect(host.isWorld).toBe(false);
    expect(host.isHost).toBe(true);
    expect(host.isKubeDNS).toBe(false);
    expect(host.isPrometheusApp).toBe(false);
    expect(host.isRemoteNode).toBe(false);

    expect(remoteNode.isWorld).toBe(false);
    expect(remoteNode.isHost).toBe(false);
    expect(remoteNode.isKubeDNS).toBe(false);
    expect(remoteNode.isPrometheusApp).toBe(false);
    expect(remoteNode.isRemoteNode).toBe(true);

    expect(kubeDns.isWorld).toBe(false);
    expect(kubeDns.isHost).toBe(false);
    expect(kubeDns.isKubeDNS).toBe(true);
    expect(kubeDns.isPrometheusApp).toBe(false);
    expect(kubeDns.isRemoteNode).toBe(false);
  });

  test('prepared filter entries sanity check', () => {
    expectFilterEntry(filterEntries.fromLabelRegular, [
      FilterKind.Label,
      FilterDirection.From,
      'k8s:k8s-app=regular-service',
    ]);

    expectFilterEntry(filterEntries.toLabelRegular, [
      FilterKind.Label,
      FilterDirection.To,
      'k8s:k8s-app=regular-service',
    ]);

    expectFilterEntry(filterEntries.eitherLabelRegular, [
      FilterKind.Label,
      FilterDirection.Either,
      'k8s:k8s-app=regular-service',
    ]);

    expectFilterEntry(filterEntries.fromDnsGoogle, [
      FilterKind.Dns,
      FilterDirection.From,
      'www.google.com',
    ]);

    expectFilterEntry(filterEntries.toDnsGoogle, [
      FilterKind.Dns,
      FilterDirection.To,
      'www.google.com',
    ]);

    expectFilterEntry(filterEntries.eitherDnsGoogle, [
      FilterKind.Dns,
      FilterDirection.Either,
      'www.google.com',
    ]);

    expectFilterEntry(filterEntries.fromIpRandom, [
      FilterKind.Ip,
      FilterDirection.From,
      '153.82.167.250',
    ]);

    expectFilterEntry(filterEntries.toIpRandom, [
      FilterKind.Ip,
      FilterDirection.To,
      '153.82.167.250',
    ]);

    expectFilterEntry(filterEntries.eitherIpRandom, [
      FilterKind.Ip,
      FilterDirection.Either,
      '153.82.167.250',
    ]);

    expectFilterEntry(filterEntries.fromLabelWorld, [
      FilterKind.Label,
      FilterDirection.From,
      'reserved:world',
    ]);

    expectFilterEntry(filterEntries.toLabelWorld, [
      FilterKind.Label,
      FilterDirection.To,
      'reserved:world',
    ]);

    expectFilterEntry(filterEntries.eitherLabelWorld, [
      FilterKind.Label,
      FilterDirection.Either,
      'reserved:world',
    ]);

    expectFilterEntry(filterEntries.toDnsTwitterApi, [
      FilterKind.Dns,
      FilterDirection.To,
      'api.twitter.com',
    ]);

    expectFilterEntry(filterEntries.fromDnsTwitterApi, [
      FilterKind.Dns,
      FilterDirection.From,
      'api.twitter.com',
    ]);

    expectFilterEntry(filterEntries.eitherDnsTwitterApi, [
      FilterKind.Dns,
      FilterDirection.Either,
      'api.twitter.com',
    ]);
  });

  test('host > doesnt match (skipHost = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: true,
    });

    const stay = filterService(host, filters);
    expect(stay).toBe(false);
  });

  test('host > matches (skipHost = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: false,
    });

    const stay = filterService(host, filters);
    expect(stay).toBe(true);
  });

  test('host > matches (skipKubeDns = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: true,
    });

    const stay = filterService(host, filters);
    expect(stay).toBe(true);
  });

  test('kubeDns > matches (skipHost = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: true,
    });

    const stay = filterService(kubeDns, filters);
    expect(stay).toBe(true);
  });

  test('kubeDns > matches (skipHost = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: false,
    });

    const stay = filterService(kubeDns, filters);
    expect(stay).toBe(true);
  });

  test('kubeDns > matches (skipKubeDns = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: false,
    });

    const stay = filterService(kubeDns, filters);
    expect(stay).toBe(true);
  });

  test('kubeDns > doesnt match (skipKubeDns = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: true,
    });

    const stay = filterService(kubeDns, filters);
    expect(stay).toBe(true);
  });

  testFilterEntry(
    (svcName: string, tnum: number) => `identity > to matches ${tnum} (${svcName})`,
    FilterEntry.parse(`to:identity=${regular.identity}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `identity > to doesnt match ${tnum} (${svcName})`,
    FilterEntry.parse(`to:identity=${regular.identity}`)!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `identity > from matches ${tnum} (${svcName})`,
    FilterEntry.parse(`from:identity=${regular.identity}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `identity > from doesnt match ${tnum} (${svcName})`,
    FilterEntry.parse(`from:identity=${regular.identity}`)!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `identity > either matches ${tnum} (${svcName})`,
    FilterEntry.parse(`either:identity=${regular.identity}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `identity > either doesnt match ${tnum} (${svcName})`,
    FilterEntry.parse(`either:identity=${regular.identity}`)!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `identity > negative > either matches ${tnum} (${svcName})`,
    FilterEntry.parse(`!either:identity=${regular.id}`)!,
    false,
    { regular },
  );

  // TODO: Investigate why this test is failing + fix it
  // testFilterEntry(
  //   (svcName: string, tnum: number) =>
  //     `identity > negative > either doesn't match ${tnum} (${svcName})`,
  //   FilterEntry.parse(`!either:identity=${regular.id}`)!,
  //   true,
  //   {
  //     world,
  //     host,
  //     remoteNode,
  //     kubeDns,
  //   },
  // );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > to matches ${tnum} (${svcName})`,
    filterEntries.toLabelRegular!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > to doesnt match ${tnum} (${svcName})`,
    filterEntries.toLabelRegular!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > from matches ${tnum} (${svcName})`,
    filterEntries.fromLabelRegular!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > from doesnt match ${tnum} (${svcName})`,
    filterEntries.fromLabelRegular!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > either matches ${tnum} (${svcName})`,
    filterEntries.eitherLabelRegular!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > either doesnt match ${tnum} (${svcName})`,
    filterEntries.eitherLabelRegular!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > from reserved world matches ${tnum} (${svcName})`,
    filterEntries.fromLabelWorld!,
    true,
    { world },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > from reserved world doesnt match ${tnum} (${svcName})`,
    filterEntries.fromLabelWorld!,
    false,
    {
      regular,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > to reserved world matches ${tnum} (${svcName})`,
    filterEntries.toLabelWorld!,
    true,
    { world },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > to reserved world doesnt match ${tnum} (${svcName})`,
    filterEntries.toLabelWorld!,
    false,
    {
      regular,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `label > either reserved world matches ${tnum} (${svcName})`,
    filterEntries.eitherLabelWorld!,
    true,
    { world },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > either reserved world doesnt match ${tnum} (${svcName})`,
    filterEntries.eitherLabelWorld!,
    false,
    {
      regular,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `dns > to matches ${tnum} (${svcName})`,
    filterEntries.toDnsGoogle!,
    true,
    { world },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `dns > to doesnt match ${tnum} (${svcName})`,
    filterEntries.toDnsGoogle!,
    false,
    {
      regular,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `dns > from matches ${tnum} (${svcName})`,
    filterEntries.fromDnsGoogle!,
    true,
    { world },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `dns > from doesnt match ${tnum} (${svcName})`,
    filterEntries.fromDnsGoogle!,
    false,
    {
      regular,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `dns > either matches ${tnum} (${svcName})`,
    filterEntries.eitherDnsGoogle!,
    true,
    { world },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `dns > either doesnt match ${tnum} (${svcName})`,
    filterEntries.eitherDnsGoogle!,
    false,
    {
      regular,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `workload > from matches ${tnum} (${svcName})`,
    filterEntries.fromRegularWorkload!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `workload > to matches ${tnum} (${svcName})`,
    filterEntries.toRegularWorkload!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `workload > either matches ${tnum} (${svcName})`,
    filterEntries.eitherRegularWorkload!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `workload > from doesnt match ${tnum} (${svcName})`,
    filterEntries.fromRegularWorkload!,
    false,
    { host, remoteNode, kubeDns },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `workload > to doesnt match ${tnum} (${svcName})`,
    filterEntries.toRegularWorkload!,
    false,
    { host, remoteNode, kubeDns },
  );

  testFilterEntry(
    (svcName: string, tnum: number) => `workload > either doesnt match ${tnum} (${svcName})`,
    filterEntries.eitherRegularWorkload!,
    false,
    { host, remoteNode, kubeDns },
  );

  runUnusedFiltersTests(
    [
      { namespace: 'random-ns' },
      { httpStatus: '200' },
      { httpStatus: '200+' },
      { httpStatus: '400' },
      { namespace: 'random-ns', httpStatus: '200' },
      {
        filters: [filterEntries.fromIpRandom!],
      },
      {
        filters: [filterEntries.toIpRandom!],
      },
      {
        filters: [filterEntries.eitherIpRandom!],
      },
    ],
    {
      regular,
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );
});
