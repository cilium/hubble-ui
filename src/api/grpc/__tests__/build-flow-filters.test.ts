import { EventStream } from '~/api/grpc/event-stream';
import { Filters, FilterEntry, FilterDirection } from '~/domain/filtering';
import { FlowFilter, Verdict } from '~backend/proto/flow/flow_pb';

import { filterEntries } from '~/testing/data';

// TODO: consider to move it to helper utils ~/testing/helpers
interface ExpectList {
  srcPod?: string[];
  dstPod?: string[];

  srcIp?: string[];
  dstIp?: string[];

  srcIdentity?: number[];
  dstIdentity?: number[];

  srcFqdn?: string[];
  dstFqdn?: string[];

  srcLabel?: string[];
  dstLabel?: string[];

  srcService?: string[];
  dstService?: string[];

  httpStatus?: string[];
  dnsQuery?: string[];
  verdict?: Verdict[];
  // TODO: couple of fields are skipped
}

const expectLists = (ff: FlowFilter, obj: ExpectList) => {
  const srcPod = ff.getSourcePodList();
  const dstPod = ff.getDestinationPodList();

  const srcIp = ff.getSourceIpList();
  const dstIp = ff.getDestinationIpList();

  const srcIdentity = ff.getSourceIdentityList();
  const dstIdentity = ff.getDestinationIdentityList();

  const srcFqdn = ff.getSourceFqdnList();
  const dstFqdn = ff.getDestinationFqdnList();

  const srcLabel = ff.getSourceLabelList();
  const dstLabel = ff.getDestinationLabelList();

  const srcService = ff.getSourceServiceList();
  const dstService = ff.getDestinationServiceList();

  const httpStatus = ff.getHttpStatusCodeList();
  const dnsQuery = ff.getDnsQueryList();
  const verdict = ff.getVerdictList();

  expect(srcPod.length).toBe(obj.srcPod?.length || 0);
  obj.srcPod?.forEach(v => {
    expect(srcPod.includes(v)).toBe(true);
  });

  expect(dstPod.length).toBe(obj.dstPod?.length || 0);
  obj.dstPod?.forEach(v => {
    expect(dstPod.includes(v)).toBe(true);
  });

  expect(srcIp.length).toBe(obj.srcIp?.length || 0);
  obj.srcIp?.forEach(v => {
    expect(srcIp.includes(v)).toBe(true);
  });

  expect(dstIp.length).toBe(obj.dstIp?.length || 0);
  obj.dstIp?.forEach(v => {
    expect(dstIp.includes(v)).toBe(true);
  });

  expect(srcIdentity.length).toBe(obj.srcIdentity?.length || 0);
  obj.srcIdentity?.forEach(v => {
    expect(srcIdentity.includes(v)).toBe(true);
  });

  expect(dstIdentity.length).toBe(obj.dstIdentity?.length || 0);
  obj.dstIdentity?.forEach(v => {
    expect(dstIdentity.includes(v)).toBe(true);
  });

  expect(srcFqdn.length).toBe(obj.srcFqdn?.length || 0);
  obj.srcFqdn?.forEach(v => {
    expect(srcFqdn.includes(v)).toBe(true);
  });

  expect(dstFqdn.length).toBe(obj.dstFqdn?.length || 0);
  obj.dstFqdn?.forEach(v => {
    expect(dstFqdn.includes(v)).toBe(true);
  });

  expect(srcLabel.length).toBe(obj.srcLabel?.length || 0);
  obj.srcLabel?.forEach(v => {
    expect(srcLabel.includes(v)).toBe(true);
  });

  expect(dstLabel.length).toBe(obj.dstLabel?.length || 0);
  obj.dstLabel?.forEach(v => {
    expect(dstLabel.includes(v)).toBe(true);
  });

  expect(srcService.length).toBe(obj.srcService?.length || 0);
  obj.srcService?.forEach(v => {
    expect(srcService.includes(v)).toBe(true);
  });

  expect(dstService.length).toBe(obj.dstService?.length || 0);
  obj.dstService?.forEach(v => {
    expect(dstService.includes(v)).toBe(true);
  });

  expect(httpStatus.length).toBe(obj.httpStatus?.length || 0);
  obj.httpStatus?.forEach(v => {
    expect(httpStatus.includes(v)).toBe(true);
  });

  expect(verdict.length).toBe(obj.verdict?.length || 0);
  obj.verdict?.forEach(v => {
    expect(verdict.includes(v)).toBe(true);
  });

  expect(dnsQuery.length).toBe(obj.dnsQuery?.length || 0);
  obj.dnsQuery?.forEach(v => {
    expect(dnsQuery.includes(v)).toBe(true);
  });
};

describe('EventStream::buildFlowFilters', () => {
  test('test 1 - no filter entries', () => {
    const ns = 'random-namespace';
    const filters = new Filters({
      namespace: ns,
      filters: [],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [a, b] = wl;
    // NOTE: by default, only traffic either from ns OR to ns is allowed
    expectLists(a, { srcPod: [`${ns}/`] });
    expectLists(b, { dstPod: [`${ns}/`] });
  });

  test('test 2 - fromLabelRegular', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.fromLabelRegular!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [toInside, fromInside] = wl;
    // NOTE: flows to current ns AND specified label...
    expectLists(toInside, { dstPod: [`${ns}/`], srcLabel: [fe.query] });

    // NOTE: ...OR flows from current ns AND specified label
    expectLists(fromInside, { srcPod: [`${ns}/`], srcLabel: [fe.query] });
  });

  test('test 3 - toLabelRegular', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.toLabelRegular!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [fromInside, toInside] = wl;
    // NOTE: flows from current ns AND to specified label...
    expectLists(fromInside, { srcPod: [`${ns}/`], dstLabel: [fe.query] });

    // NOTE: ...OR flows to current ns AND to specified label
    expectLists(toInside, { dstPod: [`${ns}/`], dstLabel: [fe.query] });
  });

  test('test 4 - bothLabelRegular', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.bothLabelRegular!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromLabel,
      fromInsideFromLabel,
      fromInsideToLabel,
      toInsideToLabel,
    ] = wl;
    // NOTE: flows to current ns AND from specified label...
    expectLists(toInsideFromLabel, {
      dstPod: [`${ns}/`],
      srcLabel: [fe.query],
    });

    // NOTE: ...OR flows from current ns AND from specified label
    expectLists(fromInsideFromLabel, {
      srcPod: [`${ns}/`],
      srcLabel: [fe.query],
    });

    // NOTE: ...OR flows from current ns AND to specified label...
    expectLists(fromInsideToLabel, {
      srcPod: [`${ns}/`],
      dstLabel: [fe.query],
    });

    // NOTE: ...OR flows to current ns AND to specified label
    expectLists(toInsideToLabel, { dstPod: [`${ns}/`], dstLabel: [fe.query] });
  });

  test('test 5 - from/toLabelRegular', () => {
    const ns = 'random-namespace';
    const fe = [filterEntries.fromLabelRegular!, filterEntries.toLabelRegular!];
    const filters = new Filters({
      namespace: ns,
      filters: fe,
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromLabel,
      fromInsideFromLabel,
      fromInsideToLabel,
      toInsideToLabel,
    ] = wl;
    // NOTE: flows to current ns AND from specified label...
    expectLists(toInsideFromLabel, {
      dstPod: [`${ns}/`],
      srcLabel: [fe[0].query],
    });

    // NOTE: ...OR flows from current ns AND from specified label
    expectLists(fromInsideFromLabel, {
      srcPod: [`${ns}/`],
      srcLabel: [fe[0].query],
    });

    // NOTE: ...OR flows from current ns AND to specified label...
    expectLists(fromInsideToLabel, {
      srcPod: [`${ns}/`],
      dstLabel: [fe[0].query],
    });

    // NOTE: ...OR flows to current ns AND to specified label
    expectLists(toInsideToLabel, {
      dstPod: [`${ns}/`],
      dstLabel: [fe[0].query],
    });
  });

  test('test 6 - fromDnsGoogle', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.fromDnsGoogle!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [toInside, fromInside] = wl;
    // NOTE: flows to current ns AND specified dns...
    expectLists(toInside, { dstPod: [`${ns}/`], srcFqdn: [fe.query] });

    // NOTE: ...OR flows from current ns AND specified dns
    expectLists(fromInside, { srcPod: [`${ns}/`], srcFqdn: [fe.query] });
  });

  test('test 7 - toDnsGoogle', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.toDnsGoogle!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [fromInside, toInside] = wl;
    // NOTE: flows from current ns AND to specified dns...
    expectLists(fromInside, { srcPod: [`${ns}/`], dstFqdn: [fe.query] });

    // NOTE: ...OR flows to current ns AND to specified dns
    expectLists(toInside, { dstPod: [`${ns}/`], dstFqdn: [fe.query] });
  });

  test('test 8 - bothDnsGoogle', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.bothDnsGoogle!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromLabel,
      fromInsideFromLabel,
      fromInsideToLabel,
      toInsideToLabel,
    ] = wl;
    // NOTE: flows to current ns AND from specified dns...
    expectLists(toInsideFromLabel, {
      dstPod: [`${ns}/`],
      srcFqdn: [fe.query],
    });

    // NOTE: ...OR flows from current ns AND from specified dns
    expectLists(fromInsideFromLabel, {
      srcPod: [`${ns}/`],
      srcFqdn: [fe.query],
    });

    // NOTE: ...OR flows from current ns AND to specified dns...
    expectLists(fromInsideToLabel, {
      srcPod: [`${ns}/`],
      dstFqdn: [fe.query],
    });

    // NOTE: ...OR flows to current ns AND to specified dns
    expectLists(toInsideToLabel, { dstPod: [`${ns}/`], dstFqdn: [fe.query] });
  });

  test('test 9 - from/toDnsGoogle', () => {
    const ns = 'random-namespace';
    const fe = [filterEntries.fromDnsGoogle!, filterEntries.toDnsGoogle!];
    const filters = new Filters({
      namespace: ns,
      filters: fe,
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromLabel,
      fromInsideFromLabel,
      fromInsideToLabel,
      toInsideToLabel,
    ] = wl;
    // NOTE: flows to current ns AND from specified dns...
    expectLists(toInsideFromLabel, {
      dstPod: [`${ns}/`],
      srcFqdn: [fe[0].query],
    });

    // NOTE: ...OR flows from current ns AND from specified dns
    expectLists(fromInsideFromLabel, {
      srcPod: [`${ns}/`],
      srcFqdn: [fe[0].query],
    });

    // NOTE: ...OR flows from current ns AND to specified dns...
    expectLists(fromInsideToLabel, {
      srcPod: [`${ns}/`],
      dstFqdn: [fe[0].query],
    });

    // NOTE: ...OR flows to current ns AND to specified dns
    expectLists(toInsideToLabel, {
      dstPod: [`${ns}/`],
      dstFqdn: [fe[0].query],
    });
  });

  test('test 10 - fromRandomIp', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.fromIpRandom!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [toInside, fromInside] = wl;
    // NOTE: flows to current ns AND specified ip...
    expectLists(toInside, { dstPod: [`${ns}/`], srcIp: [fe.query] });

    // NOTE: ...OR flows from current ns AND specified ip
    expectLists(fromInside, { srcPod: [`${ns}/`], srcIp: [fe.query] });
  });

  test('test 11 - toRandomIp', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.toIpRandom!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [fromInside, toInside] = wl;
    // NOTE: flows from current ns AND to specified ip...
    expectLists(fromInside, { srcPod: [`${ns}/`], dstIp: [fe.query] });

    // NOTE: ...OR flows to current ns AND to specified ip
    expectLists(toInside, { dstPod: [`${ns}/`], dstIp: [fe.query] });
  });

  test('test 12 - bothRandomIp', () => {
    const ns = 'random-namespace';
    const fe = filterEntries.bothIpRandom!;
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromLabel,
      fromInsideFromLabel,
      fromInsideToLabel,
      toInsideToLabel,
    ] = wl;
    // NOTE: flows to current ns AND from specified ip...
    expectLists(toInsideFromLabel, {
      dstPod: [`${ns}/`],
      srcIp: [fe.query],
    });

    // NOTE: ...OR flows from current ns AND from specified ip
    expectLists(fromInsideFromLabel, {
      srcPod: [`${ns}/`],
      srcIp: [fe.query],
    });

    // NOTE: ...OR flows from current ns AND to specified ip...
    expectLists(fromInsideToLabel, {
      srcPod: [`${ns}/`],
      dstIp: [fe.query],
    });

    // NOTE: ...OR flows to current ns AND to specified ip
    expectLists(toInsideToLabel, { dstPod: [`${ns}/`], dstIp: [fe.query] });
  });

  test('test 13 - from/toRandomIp', () => {
    const ns = 'random-namespace';
    const fe = [filterEntries.fromIpRandom!, filterEntries.toIpRandom!];
    const filters = new Filters({
      namespace: ns,
      filters: fe,
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromLabel,
      fromInsideFromLabel,
      fromInsideToLabel,
      toInsideToLabel,
    ] = wl;
    // NOTE: flows to current ns AND from specified ip...
    expectLists(toInsideFromLabel, {
      dstPod: [`${ns}/`],
      srcIp: [fe[0].query],
    });

    // NOTE: ...OR flows from current ns AND from specified ip
    expectLists(fromInsideFromLabel, {
      srcPod: [`${ns}/`],
      srcIp: [fe[0].query],
    });

    // NOTE: ...OR flows from current ns AND to specified ip...
    expectLists(fromInsideToLabel, {
      srcPod: [`${ns}/`],
      dstIp: [fe[0].query],
    });

    // NOTE: ...OR flows to current ns AND to specified ip
    expectLists(toInsideToLabel, { dstPod: [`${ns}/`], dstIp: [fe[0].query] });
  });

  const ns = 'crawler-namespace';
  const ns1 = 'another-namespace';
  const fe = FilterEntry.newPodSelector({
    pod: 'crawler-12345',
    namespace: ns,
  });

  test('test 14 - fromPod (same namespace)', () => {
    const filters = new Filters({
      namespace: ns,
      filters: [fe.setDirection(FilterDirection.From)],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [toInside, fromInside] = wl;
    // NOTE: flows to current ns AND specified pod...
    expectLists(toInside, {
      dstPod: [`${ns}/`],
      srcPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows from current ns AND specified pod
    expectLists(fromInside, { srcPod: [`${ns}/${fe.query}`] });
  });

  test('test 15 - fromPod (different namespaces)', () => {
    const filters = new Filters({
      namespace: ns1,
      filters: [fe.setDirection(FilterDirection.From)],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [toInside, fromInside] = wl;
    // NOTE: flows to current ns AND specified pod...
    expectLists(toInside, {
      dstPod: [`${ns1}/`],
      srcPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows from current ns AND specified pod
    expectLists(fromInside, {
      srcPod: [`${ns}/${fe.query}`],
      dstPod: [`${ns1}/`],
    });
  });

  test('test 16 - toPod (same namespace)', () => {
    const filters = new Filters({
      namespace: ns,
      filters: [fe.setDirection(FilterDirection.To)],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [fromInside, toInside] = wl;
    // NOTE: flows from current ns AND to specified pod...
    expectLists(fromInside, {
      srcPod: [`${ns}/`],
      dstPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows to current ns AND to specified pod
    expectLists(toInside, { dstPod: [`${ns}/${fe.query}`] });
  });

  test('test 17 - toPod (different namespaces)', () => {
    const filters = new Filters({
      namespace: ns1,
      filters: [fe.setDirection(FilterDirection.To)],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(2);

    const [fromInside, toInside] = wl;
    // NOTE: flows from current ns AND to specified pod...
    expectLists(fromInside, {
      srcPod: [`${ns1}/`],
      dstPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows to current ns AND to specified pod
    expectLists(toInside, {
      srcPod: [`${ns1}/`],
      dstPod: [`${ns}/${fe.query}`],
    });
  });

  test('test 18 - bothPod (same namespace)', () => {
    const filters = new Filters({
      namespace: ns,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromPod,
      fromInsideFromPod,
      fromInsideToPod,
      toInsideToPod,
    ] = wl;
    // NOTE: flows to current ns AND from specified pod...
    expectLists(toInsideFromPod, {
      dstPod: [`${ns}/`],
      srcPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows from current ns AND from specified pod
    expectLists(fromInsideFromPod, {
      srcPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows from current ns AND to specified pod...
    expectLists(fromInsideToPod, {
      srcPod: [`${ns}/`],
      dstPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows to current ns AND to specified pod
    expectLists(toInsideToPod, { dstPod: [`${ns}/${fe.query}`] });
  });

  test('test 19 - bothPod (different namespace)', () => {
    const filters = new Filters({
      namespace: ns1,
      filters: [fe],
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromPod,
      fromInsideFromPod,
      fromInsideToPod,
      toInsideToPod,
    ] = wl;
    // NOTE: flows to current ns AND from specified pod...
    expectLists(toInsideFromPod, {
      dstPod: [`${ns1}/`],
      srcPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows from current ns AND from specified pod
    expectLists(fromInsideFromPod, {
      dstPod: [`${ns1}/`],
      srcPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows from current ns AND to specified pod...
    expectLists(fromInsideToPod, {
      srcPod: [`${ns1}/`],
      dstPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows to current ns AND to specified pod
    expectLists(toInsideToPod, {
      srcPod: [`${ns1}/`],
      dstPod: [`${ns}/${fe.query}`],
    });
  });

  test('test 19 - from/toPod (same namespace)', () => {
    const fes = [
      fe.setDirection(FilterDirection.From),
      fe.setDirection(FilterDirection.To),
    ];

    const filters = new Filters({
      namespace: ns,
      filters: fes,
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromPod,
      fromInsideFromPod,
      fromInsideToPod,
      toInsideToPod,
    ] = wl;
    // NOTE: flows to current ns AND from specified pod...
    expectLists(toInsideFromPod, {
      dstPod: [`${ns}/`],
      srcPod: [`${ns}/${fes[0].query}`],
    });

    // NOTE: ...OR flows from current ns AND from specified pod
    expectLists(fromInsideFromPod, {
      srcPod: [`${ns}/${fes[0].query}`],
    });

    // NOTE: ...OR flows from current ns AND to specified pod...
    expectLists(fromInsideToPod, {
      srcPod: [`${ns}/`],
      dstPod: [`${ns}/${fes[0].query}`],
    });

    // NOTE: ...OR flows to current ns AND to specified pod
    expectLists(toInsideToPod, { dstPod: [`${ns}/${fes[0].query}`] });
  });

  test('test 20 - from/toPod (different namespace)', () => {
    const fes = [
      fe.setDirection(FilterDirection.From),
      fe.setDirection(FilterDirection.To),
    ];

    const filters = new Filters({
      namespace: ns1,
      filters: fes,
    });

    const [wl] = EventStream.buildFlowFilters(filters);
    expect(wl.length).toBe(4);

    const [
      toInsideFromPod,
      fromInsideFromPod,
      fromInsideToPod,
      toInsideToPod,
    ] = wl;
    // NOTE: flows to current ns AND from specified pod...
    expectLists(toInsideFromPod, {
      dstPod: [`${ns1}/`],
      srcPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows from current ns AND from specified pod
    expectLists(fromInsideFromPod, {
      dstPod: [`${ns1}/`],
      srcPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows from current ns AND to specified pod...
    expectLists(fromInsideToPod, {
      srcPod: [`${ns1}/`],
      dstPod: [`${ns}/${fe.query}`],
    });

    // NOTE: ...OR flows to current ns AND to specified pod
    expectLists(toInsideToPod, {
      srcPod: [`${ns1}/`],
      dstPod: [`${ns}/${fe.query}`],
    });
  });
});
