import { Filters, filterFlow, filterFlowByEntry, FilterEntry } from '~/domain/filtering';

import { Dictionary } from '~/domain/misc';
import { Verdict } from '~/domain/hubble';
import { Flow } from '~/domain/flows';

import * as combinations from '~/utils/iter-tools/combinations';
import { flows } from '~/testing/data';
import * as thelpers from '~/testing/helpers';

const testFilterEntry = (
  captionFn: (flowName: string, testNum: number) => string,
  entry: FilterEntry,
  expected: boolean,
  flows: Dictionary<Flow>,
) => {
  Object.keys(flows).forEach((flowName: string, lidx: number) => {
    const flow = flows[flowName];
    const caption = captionFn(flowName, lidx + 1);

    test(caption, () => {
      const result = filterFlowByEntry(flow, entry);

      expect(result).toBe(expected);
    });
  });
};

describe('filterFlow', () => {
  const sameNsFlow = new Flow(flows.hubbleSameNamespace);
  const diffNsFlow = new Flow(flows.hubbleOne);
  const verdictDropped = new Flow(flows.hubbleDropped);
  const verdictUnknown = new Flow(flows.hubbleVerdictUnknown);
  const flowHttp200 = new Flow(flows.hubbleWithHttp200);
  const fromGoogleFlow = new Flow(flows.flowFromGoogle);
  const toGoogleFlow = new Flow(flows.flowToGoogle);
  const eitherGoogleFlow = new Flow(flows.flowFromToGoogle);
  const sameIpsFlow = new Flow(flows.sameIps);
  const sameV6IpsFlow = new Flow(flows.sameV6Ips);
  const differentIpsFlow = new Flow(flows.differentIps);
  const toKubeDNSFlow = new Flow(flows.toKubeDNS);
  const fromKubeDNSFlow = new Flow(flows.fromKubeDNS);
  const eitherKubeDNSFlow = new Flow(flows.fromToKubeDNS);
  const toHostFlow = new Flow(flows.toHost);
  const fromHostFlow = new Flow(flows.fromHost);
  const eitherHostFlow = new Flow(flows.fromToHost);

  const [senderPod, receiverPod] = ['sender-pod-12345', 'receiver-pod-54321'];
  let temp = thelpers.flowsBetweenPods(senderPod, receiverPod);
  const fromSenderToReceiverPod = new Flow(temp.fromAtoB);
  const fromReceiverToSenderPod = new Flow(temp.fromBtoA);
  temp = thelpers.flowsBetweenPods(senderPod, senderPod);
  const fromSenderToSenderPod = new Flow(temp.fromAtoB);

  test('namespace > matches to source and destination', () => {
    const filters: Filters = Filters.fromObject({
      namespace: 'kube-system',
    });

    const stay = filterFlow(sameNsFlow, filters);
    expect(stay).toBe(true);
  });

  test(`namespace > doesn't match with source and destination`, () => {
    const filters: Filters = Filters.fromObject({
      namespace: 'random-123987-ns',
    });

    const stay = filterFlow(diffNsFlow, filters);
    expect(stay).toBe(false);
  });

  test('namespace > matches with source', () => {
    const filters: Filters = Filters.fromObject({
      namespace: 'SenderNs',
    });

    const stay = filterFlow(diffNsFlow, filters);
    expect(stay).toBe(true);
  });

  test('namespace > matches with destination', () => {
    const filters: Filters = Filters.fromObject({
      namespace: 'ReceiverNs',
    });

    const stay = filterFlow(diffNsFlow, filters);
    expect(stay).toBe(true);
  });

  test('verdict > matches (Forwarded)', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Forwarded]),
    });

    const stay = filterFlow(diffNsFlow, filters);
    expect(stay).toBe(true);
  });

  test(`verdict > doesn't match (Forwarded vs Dropped)`, () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Dropped]),
    });

    const stay = filterFlow(diffNsFlow, filters);
    expect(stay).toBe(false);
  });

  test(`verdict > doesn't match (Forwarded vs Unknown)`, () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Unknown]),
    });

    const stay = filterFlow(diffNsFlow, filters);
    expect(stay).toBe(false);
  });

  test('verdict > matches (Dropped)', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Dropped]),
    });

    const stay = filterFlow(verdictDropped, filters);
    expect(stay).toBe(true);
  });

  test(`verdict > doesn't match (Dropped vs Forwarded)`, () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Forwarded]),
    });

    const stay = filterFlow(verdictDropped, filters);
    expect(stay).toBe(false);
  });

  test(`verdict > doesn't match (Dropped vs Unknown)`, () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Unknown]),
    });

    const stay = filterFlow(verdictDropped, filters);
    expect(stay).toBe(false);
  });

  test('verdict > matches (Unknown)', () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Unknown]),
    });

    const stay = filterFlow(verdictUnknown, filters);
    expect(stay).toBe(true);
  });

  test(`verdict > doesn't match (Unknown vs Forwarded)`, () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Forwarded]),
    });

    const stay = filterFlow(verdictUnknown, filters);
    expect(stay).toBe(false);
  });

  test(`verdict > doesn't match (Unknown vs Dropped)`, () => {
    const filters: Filters = Filters.fromObject({
      verdicts: new Set([Verdict.Dropped]),
    });

    const stay = filterFlow(verdictUnknown, filters);
    expect(stay).toBe(false);
  });

  test('http status > matches (200)', () => {
    const filters: Filters = Filters.fromObject({
      httpStatus: '200',
    });

    const stay = filterFlow(flowHttp200, filters);
    expect(stay).toBe(true);
  });

  test(`http status > doesn't match (400)`, () => {
    const filters: Filters = Filters.fromObject({
      httpStatus: '400',
    });

    const stay = filterFlow(flowHttp200, filters);
    expect(stay).toBe(false);
  });

  test('http status > matches (200+)', () => {
    const filters: Filters = Filters.fromObject({
      httpStatus: '200+',
    });

    const stay = filterFlow(flowHttp200, filters);
    expect(stay).toBe(true);
  });

  test('http status > matches (100+)', () => {
    const filters: Filters = Filters.fromObject({
      httpStatus: '100+',
    });

    const stay = filterFlow(flowHttp200, filters);
    expect(stay).toBe(true);
  });

  test(`http status > doesn't match (0)`, () => {
    const filters: Filters = Filters.fromObject({
      httpStatus: '0',
    });

    const stay = filterFlow(flowHttp200, filters);
    expect(stay).toBe(false);
  });

  test(`http status > doesn't match (l7 not presented)`, () => {
    const filters: Filters = Filters.fromObject({
      httpStatus: '200',
    });

    const stay = filterFlow(sameNsFlow, filters);
    expect(stay).toBe(false);
  });

  test('to/from KubeDNS flows sanity check', () => {
    expect(flows.normalOne.sourceLabelProps.isKubeDNS).toBe(false);
    expect(flows.normalOne.destinationLabelProps.isKubeDNS).toBe(false);

    expect(toKubeDNSFlow.sourceLabelProps.isKubeDNS).toBe(false);
    expect(toKubeDNSFlow.destinationLabelProps.isKubeDNS).toBe(true);

    expect(fromKubeDNSFlow.sourceLabelProps.isKubeDNS).toBe(true);
    expect(fromKubeDNSFlow.destinationLabelProps.isKubeDNS).toBe(false);

    expect(eitherKubeDNSFlow.sourceLabelProps.isKubeDNS).toBe(true);
    expect(eitherKubeDNSFlow.destinationLabelProps.isKubeDNS).toBe(true);
  });

  // All filters on skip KubeDNS / skip host preserve target flow since
  // they are just visual (service) filters and should be violate
  // data on flows table
  test('skip kube dns > flow not skipped 1', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: true,
    });

    const stay = filterFlow(flows.normalOne, filters);
    expect(stay).toBe(true);
  });

  test('skip kube dns > flow not skipped 2', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: false,
    });

    const stay = filterFlow(flows.normalOne, filters);
    expect(stay).toBe(true);
  });

  test('skip kube dns > flow not skipped 3', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: true,
    });

    const stay = filterFlow(toKubeDNSFlow, filters);
    expect(stay).toBe(true);
  });

  test('skip kube dns > flow not skipped 4', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: false,
    });

    const stay = filterFlow(toKubeDNSFlow, filters);
    expect(stay).toBe(true);
  });

  test('skip kube dns > flow not skipped 5', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: true,
    });

    const stay = filterFlow(fromKubeDNSFlow, filters);
    expect(stay).toBe(true);
  });

  test('skip kube dns > flow not skipped 6', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: false,
    });

    const stay = filterFlow(fromKubeDNSFlow, filters);
    expect(stay).toBe(true);
  });

  test('skip kube dns > flow not skipped 7', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: true,
    });

    const stay = filterFlow(eitherKubeDNSFlow, filters);
    expect(stay).toBe(true);
  });

  test('skip kube dns > flow not skipped 8', () => {
    const filters: Filters = Filters.fromObject({
      skipKubeDns: false,
    });

    const stay = filterFlow(eitherKubeDNSFlow, filters);
    expect(stay).toBe(true);
  });

  test('to/from host flows sanity check', () => {
    expect(flows.normalOne.sourceLabelProps.isHost).toBe(false);
    expect(flows.normalOne.destinationLabelProps.isHost).toBe(false);

    expect(toHostFlow.sourceLabelProps.isHost).toBe(false);
    expect(toHostFlow.destinationLabelProps.isHost).toBe(true);

    expect(fromHostFlow.sourceLabelProps.isHost).toBe(true);
    expect(fromHostFlow.destinationLabelProps.isHost).toBe(false);

    expect(eitherHostFlow.sourceLabelProps.isHost).toBe(true);
    expect(eitherHostFlow.destinationLabelProps.isHost).toBe(true);
  });

  test('skip host > flow not skipped 1', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: true,
    });

    const stay = filterFlow(flows.normalOne, filters);
    expect(stay).toBe(true);
  });

  test('skip host > flow not skipped 2', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: false,
    });

    const stay = filterFlow(flows.normalOne, filters);
    expect(stay).toBe(true);
  });

  test('skip host > flow not skipped 3', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: true,
    });

    const stay = filterFlow(fromHostFlow, filters);
    expect(stay).toBe(false);
  });

  test('skip host > flow not skipped 4', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: false,
    });

    const stay = filterFlow(fromHostFlow, filters);
    expect(stay).toBe(true);
  });

  test('skip host > flow not skipped 5', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: true,
    });

    const stay = filterFlow(toHostFlow, filters);
    expect(stay).toBe(false);
  });

  test('skip host > flow not skipped 6', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: false,
    });

    const stay = filterFlow(toHostFlow, filters);
    expect(stay).toBe(true);
  });

  test('skip host > flow not skipped 7', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: true,
    });

    const stay = filterFlow(eitherHostFlow, filters);
    expect(stay).toBe(false);
  });

  test('skip host > flow not skipped 8', () => {
    const filters: Filters = Filters.fromObject({
      skipHost: false,
    });

    const stay = filterFlow(eitherHostFlow, filters);
    expect(stay).toBe(true);
  });

  testFilterEntry(
    (flowName: string, tnum: number) => `labels > from matches ${tnum} (${flowName})`,
    FilterEntry.parse(`from:label=namespace=SenderNs`)!,
    true,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      flowHttp200,
      sameIpsFlow,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `labels > from doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`from:label=namespace=SenderNs`)!,
    false,
    {
      sameNsFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `labels > to matches ${tnum} (${flowName})`,
    FilterEntry.parse(`to:label=namespace=ReceiverNs`)!,
    true,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      sameIpsFlow,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      fromKubeDNSFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `labels > to doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`to:label=namespace=SenderNs`)!,
    false,
    {
      sameNsFlow,
      toKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `labels > either matches ${tnum} (${flowName})`,
    FilterEntry.parse(`either:label=namespace=SenderNs`)!,
    true,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      sameIpsFlow,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `labels > either doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`either:label=namespace=random-123987-ns`)!,
    false,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      sameIpsFlow,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `dns > from matches ${tnum} (${flowName})`,
    FilterEntry.parse(`from:dns=www.google.com`)!,
    true,
    {
      fromGoogleFlow,
      eitherGoogleFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `dns > from doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`from:dns=www.google.com`)!,
    false,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      sameIpsFlow,
      sameV6IpsFlow,
      toGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `dns > to matches ${tnum} (${flowName})`,
    FilterEntry.parse(`to:dns=www.google.com`)!,
    true,
    {
      toGoogleFlow,
      eitherGoogleFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `dns > to doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`to:dns=www.google.com`)!,
    false,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      sameIpsFlow,
      sameV6IpsFlow,
      fromGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `dns > either matches ${tnum} (${flowName})`,
    FilterEntry.parse(`either:dns=www.google.com`)!,
    true,
    {
      toGoogleFlow,
      fromGoogleFlow,
      eitherGoogleFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `dns > either doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`either:dns=www.google.com`)!,
    false,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      sameIpsFlow,
      sameV6IpsFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `ip > from matches ${tnum} (${flowName})`,
    FilterEntry.parse(`from:ip=${sameIpsFlow.sourceIp}`)!,
    true,
    {
      sameIpsFlow,
      differentIpsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `ip > from doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`from:ip=0.0.0.0`)!,
    false,
    {
      sameIpsFlow,
      differentIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `ip > to matches ${tnum} (${flowName})`,
    FilterEntry.parse(`to:ip=${differentIpsFlow.destinationIp}`)!,
    true,
    {
      differentIpsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `ip > to doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`to:ip=${differentIpsFlow.destinationIp}`)!,
    false,
    {
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `ip > either matches ${tnum} (${flowName})`,
    FilterEntry.parse(`either:ip=${differentIpsFlow.sourceIp}`)!,
    true,
    {
      differentIpsFlow,
      sameIpsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `ip > either doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`either:ip=0.0.0.0`)!,
    false,
    {
      sameIpsFlow,
      differentIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `identity > from matches ${tnum} (${flowName})`,
    FilterEntry.parse(`from:identity=0`)!,
    true,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `identity > from doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`from:identity=1`)!,
    false,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `identity > to matches ${tnum} (${flowName})`,
    FilterEntry.parse(`to:identity=1`)!,
    true,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `identity > to doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`to:identity=0`)!,
    false,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `identity > either matches ${tnum} (${flowName})`,
    FilterEntry.parse(`either:identity=0`)!,
    true,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `identity > either matches ${tnum} (${flowName})`,
    FilterEntry.parse(`either:identity=1`)!,
    true,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `identity > either doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`either:identity=100500`)!,
    false,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > from sender pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`from:pod=${senderPod}`)!,
    true,
    {
      fromSenderToReceiverPod,
      fromSenderToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > from sender pod doesn't match ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`from:pod=${senderPod}`)!,
    false,
    {
      fromReceiverToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > to sender pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`to:pod=${senderPod}`)!,
    true,
    {
      fromReceiverToSenderPod,
      fromSenderToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > to sender pod doesn't match ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`to:pod=${senderPod}`)!,
    false,
    {
      fromSenderToReceiverPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > either sender pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`either:pod=${senderPod}`)!,
    true,
    {
      fromSenderToReceiverPod,
      fromReceiverToSenderPod,
      fromSenderToSenderPod,
    },
  );

  // ---
  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > from receiver pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`from:pod=${receiverPod}`)!,
    true,
    {
      fromReceiverToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > from receiver pod doesn't match ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`from:pod=${receiverPod}`)!,
    false,
    {
      fromSenderToReceiverPod,
      fromSenderToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > to receiver pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`to:pod=${receiverPod}`)!,
    true,
    {
      fromSenderToReceiverPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > to receiver pod doesn't match ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`to:pod=${receiverPod}`)!,
    false,
    {
      fromReceiverToSenderPod,
      fromSenderToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > either receiver pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`either:pod=${receiverPod}`)!,
    true,
    {
      fromSenderToReceiverPod,
      fromReceiverToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `pod > either receiver pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`either:pod=${receiverPod}`)!,
    false,
    {
      fromSenderToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `negative > from label matches ${tnum} (${flowName})`,
    FilterEntry.parse(`!from:label=namespace=SenderNs`)!,
    false,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      flowHttp200,
      sameIpsFlow,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `negative > from label doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`!from:label=namespace=SenderNs`)!,
    true,
    {
      sameNsFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `negative > either dns matches ${tnum} (${flowName})`,
    FilterEntry.parse(`!either:dns=www.google.com`)!,
    false,
    {
      toGoogleFlow,
      fromGoogleFlow,
      eitherGoogleFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `negative > either dns doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`!either:dns=www.google.com`)!,
    true,
    {
      diffNsFlow,
      differentIpsFlow,
      verdictDropped,
      verdictUnknown,
      sameIpsFlow,
      sameV6IpsFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `negative > either identity matches ${tnum} (${flowName})`,
    FilterEntry.parse(`!either:identity=1`)!,
    false,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) =>
      `negative > either identity doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`!either:identity=100500`)!,
    true,
    {
      normalOne: flows.normalOne,
      differentIpsFlow,
      sameIpsFlow,
      diffNsFlow,
      verdictDropped,
      verdictUnknown,
      sameV6IpsFlow,
      fromGoogleFlow,
      toGoogleFlow,
      eitherGoogleFlow,
      toKubeDNSFlow,
      fromKubeDNSFlow,
      eitherKubeDNSFlow,
      fromHostFlow,
      toHostFlow,
      eitherHostFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `negative > from ip matches ${tnum} (${flowName})`,
    FilterEntry.parse(`!from:ip=${differentIpsFlow.sourceIp}`)!,
    false,
    {
      differentIpsFlow,
      sameIpsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `negative > from ip doesn't match ${tnum} (${flowName})`,
    FilterEntry.parse(`!from:ip=${differentIpsFlow.destinationIp}`)!,
    true,
    {
      differentIpsFlow,
      sameIpsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `negative > either ip matches ${tnum} (${flowName})`,
    FilterEntry.parse(`!either:ip=${differentIpsFlow.sourceIp}`)!,
    false,
    {
      differentIpsFlow,
      sameIpsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `negative > either receiver pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`!either:pod=${receiverPod}`)!,
    false,
    {
      fromSenderToReceiverPod,
      fromReceiverToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => {
      return `negative > either receiver pod matches ${flowName} ${tnum}`;
    },
    FilterEntry.parse(`!either:pod=${receiverPod}`)!,
    true,
    {
      fromSenderToSenderPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `workload > to workload matches`,
    FilterEntry.parse(`to:workload=svc:receiver`)!,
    true,
    {
      diffNsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `workload > to workload doesn't match`,
    FilterEntry.parse(`to:workload=svc:receiver`)!,
    false,
    {
      fromSenderToReceiverPod,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `workload > to workload doesn't match`,
    FilterEntry.parse(`to:workload=svc:sender`)!,
    false,
    {
      diffNsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `workload > from workload matches`,
    FilterEntry.parse(`from:workload=svc:sender`)!,
    true,
    {
      diffNsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `workload > from workload doesn't match`,
    FilterEntry.parse(`from:workload=svc:receiver`)!,
    false,
    {
      diffNsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `workload > either workload matches with receiver`,
    FilterEntry.parse(`either:workload=svc:receiver`)!,
    true,
    {
      diffNsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `workload > either workload matches with sender`,
    FilterEntry.parse(`either:workload=svc:sender`)!,
    true,
    {
      diffNsFlow,
    },
  );

  testFilterEntry(
    (flowName: string, tnum: number) => `workload > either workload doesn't match`,
    FilterEntry.parse(`either:workload=svc:unknown`)!,
    false,
    {
      diffNsFlow,
    },
  );
});
