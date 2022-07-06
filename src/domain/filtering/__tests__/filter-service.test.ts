import {
  Filters,
  FiltersObject,
  filterService,
  filterServiceByEntry,
  FilterEntry,
  FilterKind,
  FilterDirection,
} from '~/domain/filtering';

import { Labels, ReservedLabel } from '~/domain/labels';
import { ServiceCard } from '~/domain/service-map';
import { Verdict } from '~/domain/hubble';
import { Dictionary } from '~/domain/misc';
import { services, filterEntries } from '~/testing/data';

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
  const kubeApiServer = ServiceCard.fromService(services.kubeApiServer);
  const worldKubeApiServer = ServiceCard.fromService(
    services.worldKubeApiServer,
  );

  test('mock data sanity check', () => {
    expect(regular.isWorld).toBe(false);
    expect(regular.isHost).toBe(false);
    expect(regular.isKubeDNS).toBe(false);
    expect(regular.isPrometheusApp).toBe(false);
    expect(regular.isRemoteNode).toBe(false);
    expect(regular.isKubeApiServer).toBe(false);

    expect(world.isWorld).toBe(true);
    expect(world.isHost).toBe(false);
    expect(world.isKubeDNS).toBe(false);
    expect(world.isPrometheusApp).toBe(false);
    expect(world.isRemoteNode).toBe(false);
    expect(world.isKubeApiServer).toBe(false);

    expect(host.isWorld).toBe(false);
    expect(host.isHost).toBe(true);
    expect(host.isKubeDNS).toBe(false);
    expect(host.isPrometheusApp).toBe(false);
    expect(host.isRemoteNode).toBe(false);
    expect(host.isKubeApiServer).toBe(false);

    expect(remoteNode.isWorld).toBe(false);
    expect(remoteNode.isHost).toBe(false);
    expect(remoteNode.isKubeDNS).toBe(false);
    expect(remoteNode.isPrometheusApp).toBe(false);
    expect(remoteNode.isRemoteNode).toBe(true);
    expect(remoteNode.isKubeApiServer).toBe(false);

    expect(kubeDns.isWorld).toBe(false);
    expect(kubeDns.isHost).toBe(false);
    expect(kubeDns.isKubeDNS).toBe(true);
    expect(kubeDns.isPrometheusApp).toBe(false);
    expect(kubeDns.isRemoteNode).toBe(false);
    expect(kubeDns.isKubeApiServer).toBe(false);

    expect(kubeApiServer.isWorld).toBe(false);
    expect(kubeApiServer.isHost).toBe(false);
    expect(kubeApiServer.isKubeDNS).toBe(false);
    expect(kubeApiServer.isPrometheusApp).toBe(false);
    expect(kubeApiServer.isRemoteNode).toBe(false);
    expect(kubeApiServer.isKubeApiServer).toBe(true);

    expect(worldKubeApiServer.isWorld).toBe(true);
    expect(worldKubeApiServer.isHost).toBe(false);
    expect(worldKubeApiServer.isKubeDNS).toBe(false);
    expect(worldKubeApiServer.isPrometheusApp).toBe(false);
    expect(worldKubeApiServer.isRemoteNode).toBe(false);
    expect(worldKubeApiServer.isKubeApiServer).toBe(true);
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

    expectFilterEntry(filterEntries.bothLabelRegular, [
      FilterKind.Label,
      FilterDirection.Both,
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

    expectFilterEntry(filterEntries.bothDnsGoogle, [
      FilterKind.Dns,
      FilterDirection.Both,
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

    expectFilterEntry(filterEntries.bothIpRandom, [
      FilterKind.Ip,
      FilterDirection.Both,
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

    expectFilterEntry(filterEntries.bothLabelWorld, [
      FilterKind.Label,
      FilterDirection.Both,
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

    expectFilterEntry(filterEntries.bothDnsTwitterApi, [
      FilterKind.Dns,
      FilterDirection.Both,
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

  test('kubeApiServer > matches (skipkubeApiServer = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeApiServer: true,
    });

    const stay = filterService(kubeApiServer, filters);
    expect(stay).toBe(false);
  });

  test('kubeApiServer > matches (skipKubeApiServer = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeApiServer: false,
    });

    const stay = filterService(kubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('kubeApiServer > matches (skipHost = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: false,
    });

    const stay = filterService(kubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('kubeApiServer > doesnt match (skipHost = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: true,
    });

    const stay = filterService(kubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('kubeApiServer > matches (skipKubeDns = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: false,
    });

    const stay = filterService(kubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('kubeApiServer > doesnt match (skipKubeDns = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: true,
    });

    const stay = filterService(kubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('kubeApiServer > matches (skipPrometheusApp = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipPrometheusApp: false,
    });

    const stay = filterService(kubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('kubeApiServer > doesnt match (skipPrometheusApp = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipPrometheusApp: true,
    });

    const stay = filterService(kubeApiServer, filters);
    expect(stay).toBe(true);
  });

  //
  test('worldKubeApiServer > matches (skipWorldKubeApiServer = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeApiServer: true,
    });

    const stay = filterService(worldKubeApiServer, filters);
    expect(stay).toBe(false);
  });

  test('worldKubeApiServer > matches (skipWorldKubeApiServer = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeApiServer: false,
    });

    const stay = filterService(worldKubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('worldKubeApiServer > matches (skipHost = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: false,
    });

    const stay = filterService(worldKubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('worldKubeApiServer > doesnt match (skipHost = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: true,
    });

    const stay = filterService(worldKubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('worldKubeApiServer > matches (skipKubeDns = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: false,
    });

    const stay = filterService(worldKubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('worldKubeApiServer > doesnt match (skipKubeDns = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: true,
    });

    const stay = filterService(worldKubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('worldKubeApiServer > matches (skipPrometheusApp = false)', () => {
    const filters: Filters = Filters.fromObject({
      skipPrometheusApp: false,
    });

    const stay = filterService(worldKubeApiServer, filters);
    expect(stay).toBe(true);
  });

  test('worldKubeApiServer > doesnt match (skipPrometheusApp = true)', () => {
    const filters: Filters = Filters.fromObject({
      skipPrometheusApp: true,
    });

    const stay = filterService(worldKubeApiServer, filters);
    expect(stay).toBe(true);
  });

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > to matches ${tnum} (${svcName})`,
    FilterEntry.parse(`to:identity=${regular.id}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > to doesnt match ${tnum} (${svcName})`,
    FilterEntry.parse(`to:identity=${regular.id}`)!,
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
    FilterEntry.parse(`from:identity=${regular.id}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > from doesnt match ${tnum} (${svcName})`,
    FilterEntry.parse(`from:identity=${regular.id}`)!,
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
    FilterEntry.parse(`both:identity=${regular.id}`)!,
    true,
    { regular },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `identity > both doesnt match ${tnum} (${svcName})`,
    FilterEntry.parse(`both:identity=${regular.id}`)!,
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
    (svcName: string, tnum: number) =>
      `label > from reserved world matches ${tnum} (${svcName})`,
    filterEntries.fromLabelWorld!,
    true,
    { world, worldKubeApiServer },
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
      kubeApiServer,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > to reserved world matches ${tnum} (${svcName})`,
    filterEntries.toLabelWorld!,
    true,
    { world, worldKubeApiServer },
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
      kubeApiServer,
    },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > both reserved world matches ${tnum} (${svcName})`,
    filterEntries.bothLabelWorld!,
    true,
    { world, worldKubeApiServer },
  );

  testFilterEntry(
    (svcName: string, tnum: number) =>
      `label > both reserved world doesnt match ${tnum} (${svcName})`,
    filterEntries.bothLabelWorld!,
    false,
    {
      regular,
      host,
      remoteNode,
      kubeDns,
      kubeApiServer,
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
      kubeApiServer,
      worldKubeApiServer,
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
      kubeApiServer,
      worldKubeApiServer,
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
      kubeApiServer,
      worldKubeApiServer,
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
