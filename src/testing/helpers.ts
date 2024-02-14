import { E2E_PREFIX } from '~/testing/constants';

import {
  HubbleService,
  HubbleFlow,
  HubbleLink,
  Verdict,
  TrafficDirection,
  FlowType,
  IPProtocol,
  AuthType,
} from '~/domain/hubble';

export interface FlowsBetween {
  fromAtoB: HubbleFlow;
  fromBtoA: HubbleFlow;
}

let flowsTimeOffset = 0;

const nextFlowTimestamp = () => {
  const obj = {
    seconds: flowsTimeOffset + Date.now() / 1000,
    nanos: Date.now() * 1000000,
  };

  flowsTimeOffset += 1;

  return obj;
};

export const flowsBetweenPods = (senderPod: string, receiverPod: string): FlowsBetween => {
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
      labels: [],
      workloads: [],
      namespace: 'sender-namespace',
      podName: senderPod,
    },
    destination: {
      id: 1,
      identity: 1,
      labels: [],
      workloads: [],
      namespace: 'receiver-namespace',
      podName: receiverPod,
    },
    sourceNamesList: [],
    destinationNamesList: [],
    nodeName: 'test-node',
    reply: false,
    summary: '',
    type: FlowType.L34,
    time: nextFlowTimestamp(),
    trafficDirection: TrafficDirection.Ingress,
    authType: AuthType.Disbaled,
  };

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
      labels: [],
      workloads: [],
      namespace: 'receiver-namespace',
      podName: receiverPod,
    },
    destination: {
      id: 0,
      identity: 0,
      labels: [],
      workloads: [],
      namespace: 'sender-namespace',
      podName: senderPod,
    },
    sourceNamesList: [],
    destinationNamesList: [],
    nodeName: 'test-node',
    reply: true,
    summary: '',
    type: FlowType.L34,
    time: nextFlowTimestamp(),
    trafficDirection: TrafficDirection.Ingress,
    authType: AuthType.Disbaled,
  };

  return { fromAtoB, fromBtoA };
};

export const flowsBetweenServices = (a: HubbleService, b: HubbleService): FlowsBetween => {
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
      labels: a.labels.map(kv => `${kv.key}=${kv.value}`),
      workloads: [],
      namespace: a.namespace,
      podName: `sender-pod`,
    },
    destination: {
      id: 1,
      identity: 1,
      labels: b.labels.map(kv => `${kv.key}=${kv.value}`),
      workloads: [],
      namespace: b.namespace,
      podName: `receiver-pod`,
    },
    sourceNamesList: a.dnsNames,
    destinationNamesList: b.dnsNames,
    nodeName: 'test-node',
    reply: false,
    summary: '',
    type: FlowType.L34,
    time: nextFlowTimestamp(),
    trafficDirection: TrafficDirection.Ingress,
    authType: AuthType.Disbaled,
  };

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
      labels: b.labels.map(kv => `${kv.key}=${kv.value}`),
      workloads: [],
      namespace: b.namespace,
      podName: `receiver-pod`,
    },
    destination: {
      id: 0,
      identity: 0,
      labels: a.labels.map(kv => `${kv.key}=${kv.value}`),
      workloads: [],
      namespace: a.namespace,
      podName: `sender-pod`,
    },
    sourceNamesList: b.dnsNames,
    destinationNamesList: a.dnsNames,
    nodeName: 'test-node',
    reply: true,
    summary: '',
    type: FlowType.L34,
    time: nextFlowTimestamp(),
    trafficDirection: TrafficDirection.Ingress,
    authType: AuthType.Disbaled,
  };

  return { fromAtoB, fromBtoA };
};

export const flowsFromToService = (from: HubbleService, to: HubbleService) => {
  const stage2Builder = (
    ipProto: IPProtocol,
    verdict: Verdict,
    sourcePort: number,
    destinationPort: number,
  ): FlowsBetween => {
    const l4 = { sourcePort, destinationPort };
    const l4Reversed = {
      sourcePort: destinationPort,
      destinationPort: sourcePort,
    };

    const fromAtoB: HubbleFlow = {
      verdict,
      dropReason: 0,
      l4: {
        tcp: ipProto === IPProtocol.TCP ? l4 : undefined,
        udp: ipProto === IPProtocol.UDP ? l4 : undefined,
      },
      source: {
        id: 0,
        identity: 0,
        labels: from.labels.map(kv => `${kv.key}=${kv.value}`),
        workloads: [],
        namespace: from.namespace,
        podName: `sender-pod`,
      },
      destination: {
        id: 1,
        identity: 1,
        labels: to.labels.map(kv => `${kv.key}=${kv.value}`),
        workloads: [],
        namespace: to.namespace,
        podName: `receiver-pod`,
      },
      sourceNamesList: from.dnsNames,
      destinationNamesList: to.dnsNames,
      nodeName: 'test-node',
      reply: false,
      summary: '',
      type: FlowType.L34,
      time: nextFlowTimestamp(),
      trafficDirection: TrafficDirection.Ingress,
      authType: AuthType.Disbaled,
    };

    const fromBtoA: HubbleFlow = {
      verdict,
      dropReason: 0,
      l4: {
        tcp: ipProto === IPProtocol.TCP ? l4Reversed : undefined,
        udp: ipProto === IPProtocol.UDP ? l4Reversed : undefined,
      },
      source: {
        id: 1,
        identity: 1,
        labels: to.labels.map(kv => `${kv.key}=${kv.value}`),
        workloads: [],
        namespace: to.namespace,
        podName: `receiver-pod`,
      },
      destination: {
        id: 0,
        identity: 0,
        labels: from.labels.map(kv => `${kv.key}=${kv.value}`),
        workloads: [],
        namespace: from.namespace,
        podName: `sender-pod`,
      },
      sourceNamesList: to.dnsNames,
      destinationNamesList: from.dnsNames,
      nodeName: 'test-node',
      reply: true,
      summary: '',
      type: FlowType.L34,
      time: nextFlowTimestamp(),
      trafficDirection: TrafficDirection.Ingress,
      authType: AuthType.Disbaled,
    };

    return { fromAtoB, fromBtoA };
  };

  const stage1Builder = (ipProto: IPProtocol) => {
    return (sourcePort: number, destinationPort: number) => {
      return {
        forwarded: () => stage2Builder(ipProto, Verdict.Forwarded, sourcePort, destinationPort),
        dropped: () => stage2Builder(ipProto, Verdict.Dropped, sourcePort, destinationPort),
      };
    };
  };

  return {
    tcp: stage1Builder(IPProtocol.TCP),
    udp: stage1Builder(IPProtocol.UDP),
  };
};

export const linkFromToService = (from: HubbleService, to: HubbleService) => {
  const stage2Builder = (ipProto: IPProtocol, port: number, verdict: Verdict): HubbleLink => {
    return {
      id: `${from.id} -> ${to.id}:${port} (${Verdict[verdict]})`,
      sourceId: from.id,
      destinationId: to.id,
      destinationPort: port,
      ipProtocol: ipProto,
      verdict,
      flowAmount: 2,
      bytesTransfered: 8192,
      latency: {
        min: { seconds: 0, nanos: 5e6 },
        max: { seconds: 0, nanos: 25e6 },
        avg: { seconds: 0, nanos: 15e6 },
      },
      authType: AuthType.Disbaled,
      isEncrypted: false,
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

const isTestingEnv = () => {
  const nenv = process.env.NODE_ENV;
  const e2eTestMode = process.env.E2E_TEST_MODE === 'true';
  const mockModeParam = new URLSearchParams(document.location.search).get('e2e');

  return (
    nenv?.startsWith('test') || nenv?.startsWith('e2e') || e2eTestMode || mockModeParam != null
  );
};

/**
 * This function take either a string as parameter or an object and returns
 * test attributes if env.NODE_ENV is dev, or env.E2E_TEST_MODE is set to true.
 *
 * If it gets a string, it returns an object with the common data attributes
 * we use to store id. If it takes an object, it returns the same object with
 * all the keys prefixed with the suffix we use for e2e tests.
 *
 * @example
 * // returns { "data-test": "my-value" }
 * getTestAttributes("my-value");
 * @example
 * // returns { "data-test-my-attribute": "my-value" }
 * getTestAttributes({ "my-attribute": "my-value "});
 */
export const getTestAttributes = (
  sel: string | { [attr: string]: string },
): { [attr: string]: string } => {
  if (!isTestingEnv()) return {};

  if (typeof sel !== 'string') {
    const attributes = Object.keys(sel).map(attr => ({
      [`${E2E_PREFIX}-${attr}`]: sel[attr],
    }));

    return Object.assign({}, ...attributes);
  }
  return { [E2E_PREFIX]: sel };
};
