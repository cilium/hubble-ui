import {
  Filters,
  FiltersObject,
  filterService,
  filterServiceUsingBasicEntry,
} from '~/domain/filtering';

import { ServiceCard } from '~/domain/service-card';
import { Verdict } from '~/domain/hubble';
import { Dictionary } from '~/domain/misc';
import { services } from '~/testing/data';
import {
  FlowsFilterEntry,
  FlowsFilterKind,
  FlowsFilterDirection,
} from '~/domain/flows';

import { expectFilterEntry } from './general';

const runUnusedFiltersTests = (
  filters: FiltersObject[],
  services: Dictionary<ServiceCard>,
) => {
  Object.keys(services).forEach((linkName: string) => {
    const service = services[linkName];

    filters.forEach((f: FiltersObject, fidx: number) => {
      test(`unused filter fields test, service: ${linkName}, filters: ${
        fidx + 1
      }`, () => {
        const stay = filterService(service, Filters.fromObject(f));
        expect(stay).toBe(true);
      });
    });
  });
};

const testFilterEntry = (
  captionFn: (serviceName: string, testNum: number) => string,
  entry: FlowsFilterEntry,
  expected: boolean,
  services: Dictionary<ServiceCard>,
) => {
  Object.keys(services).forEach((serviceName: string, lidx: number) => {
    const service = services[serviceName].service;
    const caption = captionFn(serviceName, lidx + 1);

    test(caption, () => {
      const result = filterServiceUsingBasicEntry(service, entry);

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

  const filterEntries = {
    fromLabelRegular: FlowsFilterEntry.parse(
      `from:label=k8s:k8s-app=regular-service`,
    ),
    toLabelRegular: FlowsFilterEntry.parse(
      `to:label=k8s:k8s-app=regular-service`,
    ),
    bothLabelRegular: FlowsFilterEntry.parse(
      `both:label=k8s:k8s-app=regular-service`,
    ),
    toDnsGoogle: FlowsFilterEntry.parse(`to:dns=www.google.com`),
    fromDnsGoogle: FlowsFilterEntry.parse(`from:dns=www.google.com`),
    bothDnsGoogle: FlowsFilterEntry.parse(`both:dns=www.google.com`),
    fromIpRandom: FlowsFilterEntry.parse(`from:ip=153.82.167.250`),
    toIpRandom: FlowsFilterEntry.parse(`to:ip=153.82.167.250`),
    bothIpRandom: FlowsFilterEntry.parse(`both:ip=153.82.167.250`),
  };

  test('mock data sanity check', () => {
    expect(regular.isWorld).toBe(false);
    expect(regular.isHost).toBe(false);
    expect(regular.isKubeDNS).toBe(false);
    expect(regular.isPrometheusApp).toBe(false);
    expect(regular.isRemoteNode).toBe(false);

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
      FlowsFilterKind.Label,
      FlowsFilterDirection.From,
      'k8s:k8s-app=regular-service',
    ]);

    expectFilterEntry(filterEntries.toLabelRegular, [
      FlowsFilterKind.Label,
      FlowsFilterDirection.To,
      'k8s:k8s-app=regular-service',
    ]);

    expectFilterEntry(filterEntries.bothLabelRegular, [
      FlowsFilterKind.Label,
      FlowsFilterDirection.Both,
      'k8s:k8s-app=regular-service',
    ]);

    expectFilterEntry(filterEntries.fromDnsGoogle, [
      FlowsFilterKind.Dns,
      FlowsFilterDirection.From,
      'www.google.com',
    ]);

    expectFilterEntry(filterEntries.toDnsGoogle, [
      FlowsFilterKind.Dns,
      FlowsFilterDirection.To,
      'www.google.com',
    ]);

    expectFilterEntry(filterEntries.bothDnsGoogle, [
      FlowsFilterKind.Dns,
      FlowsFilterDirection.Both,
      'www.google.com',
    ]);

    expectFilterEntry(filterEntries.fromIpRandom, [
      FlowsFilterKind.Ip,
      FlowsFilterDirection.From,
      '153.82.167.250',
    ]);

    expectFilterEntry(filterEntries.toIpRandom, [
      FlowsFilterKind.Ip,
      FlowsFilterDirection.To,
      '153.82.167.250',
    ]);

    expectFilterEntry(filterEntries.bothIpRandom, [
      FlowsFilterKind.Ip,
      FlowsFilterDirection.Both,
      '153.82.167.250',
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
    expect(stay).toBe(false);
  });

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > to matches ${tnum} (${svcName})`,
    FlowsFilterEntry.parse(`to:identity=${regular.id}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > to doesnt match ${tnum} (${svcName})`,
    FlowsFilterEntry.parse(`to:identity=${regular.id}`)!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > from matches ${tnum} (${svcName})`,
    FlowsFilterEntry.parse(`from:identity=${regular.id}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > from doesnt match ${tnum} (${svcName})`,
    FlowsFilterEntry.parse(`from:identity=${regular.id}`)!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > both matches ${tnum} (${svcName})`,
    FlowsFilterEntry.parse(`both:identity=${regular.id}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > both doesnt match ${tnum} (${svcName})`,
    FlowsFilterEntry.parse(`both:identity=${regular.id}`)!,
    false,
    {
      world,
      host,
      remoteNode,
      kubeDns,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > to matches ${tnum} (${svcName})`,
    filterEntries.toLabelRegular!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > to doesnt match ${tnum} (${svcName})`,
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
    (svcName: string, tnum: number) =>
      `label > from matches ${tnum} (${svcName})`,
    filterEntries.fromLabelRegular!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > from doesnt match ${tnum} (${svcName})`,
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
    (svcName: string, tnum: number) =>
      `label > both matches ${tnum} (${svcName})`,
    filterEntries.bothLabelRegular!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > both doesnt match ${tnum} (${svcName})`,
    filterEntries.bothLabelRegular!,
    false,
    {
      world,
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
    (svcName: string, tnum: number) =>
      `dns > to doesnt match ${tnum} (${svcName})`,
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
    (svcName: string, tnum: number) =>
      `dns > from matches ${tnum} (${svcName})`,
    filterEntries.fromDnsGoogle!,
    true,
    { world },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `dns > from doesnt match ${tnum} (${svcName})`,
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
    (svcName: string, tnum: number) =>
      `dns > both matches ${tnum} (${svcName})`,
    filterEntries.bothDnsGoogle!,
    true,
    { world },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `dns > both doesnt match ${tnum} (${svcName})`,
    filterEntries.bothDnsGoogle!,
    false,
    {
      regular,
      host,
      remoteNode,
      kubeDns,
    },
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
        filters: [filterEntries.bothIpRandom!],
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
