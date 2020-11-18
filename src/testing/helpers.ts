import {
  HubbleService,
  HubbleFlow,
  HubbleLink,
  Verdict,
  TrafficDirection,
  FlowType,
  IPProtocol,
} from '~/domain/hubble';

export interface FlowsBetween {
  fromAtoB: HubbleFlow;
  fromBtoA: HubbleFlow;
}

let flowsTimeOffset = 0;

export const flowsBetweenServices = (
  a: HubbleService,
  b: HubbleService,
): FlowsBetween => {
  const fromAtoB: HubbleFlow = {
    verdict: Verdict.Forwarded,
    dropReason: 0,
    l4: {
      tcp: {
        destinationPort: 80,
        sourcePort: 56789,
      },
    },
    source: {
      id: 0,
      identity: 0,
      labelsList: a.labels.map(kv => `${kv.key}=${kv.value}`),
      namespace: a.namespace,
      podName: `sender-pod`,
    },
    destination: {
      id: 1,
      identity: 1,
      labelsList: b.labels.map(kv => `${kv.key}=${kv.value}`),
      namespace: b.namespace,
      podName: `receiver-pod`,
    },
    sourceNamesList: [],
    destinationNamesList: [],
    nodeName: 'test-node',
    reply: false,
    summary: '',
    type: FlowType.L34,
    time: {
      seconds: flowsTimeOffset + Date.now() / 1000,
      nanos: Date.now() * 1000000,
    },
    trafficDirection: TrafficDirection.Ingress,
  };

  flowsTimeOffset += 1;

  const fromBtoA: HubbleFlow = {
    verdict: Verdict.Forwarded,
    dropReason: 0,
    l4: {
      tcp: {
        destinationPort: 56789,
        sourcePort: 80,
      },
    },
    source: {
      id: 1,
      identity: 1,
      labelsList: b.labels.map(kv => `${kv.key}=${kv.value}`),
      namespace: b.namespace,
      podName: `receiver-pod`,
    },
    destination: {
      id: 0,
      identity: 0,
      labelsList: a.labels.map(kv => `${kv.key}=${kv.value}`),
      namespace: a.namespace,
      podName: `sender-pod`,
    },
    sourceNamesList: [],
    destinationNamesList: [],
    nodeName: 'test-node',
    reply: true,
    summary: '',
    type: FlowType.L34,
    time: {
      seconds: flowsTimeOffset + Date.now() / 1000,
      nanos: Date.now() * 1000000,
    },
    trafficDirection: TrafficDirection.Ingress,
  };

  flowsTimeOffset += 1;

  return { fromAtoB, fromBtoA };
};

export const linkFromToService = (from: HubbleService, to: HubbleService) => {
  const stage2Builder = (
    ipProto: IPProtocol,
    port: number,
    verdict: Verdict,
  ): HubbleLink => {
    return {
      id: `${from.id} -> ${to.id}:${port} (${Verdict[verdict]})`,
      sourceId: from.id,
      destinationId: to.id,
      destinationPort: port,
      ipProtocol: ipProto,
      verdict,
    };
  };

  const stage1Builder = (ipProto: IPProtocol) => {
    return (port: number) => {
      return {
        forwarded: () => stage2Builder(ipProto, port, Verdict.Forwarded),
        dropped: () => stage2Builder(ipProto, port, Verdict.Dropped),
      };
    };
  };

  return {
    tcp: stage1Builder(IPProtocol.TCP),
    udp: stage1Builder(IPProtocol.UDP),
  };
};
