import { Flow } from '~/domain/flows';
import {
  HubbleFlow,
  Verdict,
  FlowType,
  Endpoint,
  TrafficDirection,
  L7FlowType,
  IPVersion,
  AuthType,
} from '~/domain/hubble';

import { SpecialLabel, ReservedLabel } from '~/domain/labels';

const nowMs = Date.now();

export const icmpv4Flow: HubbleFlow = {
  verdict: Verdict.Forwarded,
  dropReason: 0,
  l4: {
    icmpv4: {
      type: 0,
      code: 0,
    },
  },
  source: {
    id: 0,
    identity: 0,
    labels: ['app=Sender', 'namespace=SenderNs'],
    workloads: [],
    namespace: 'SenderNs',
    podName: `sender-a1b2c3`,
  },
  destination: {
    id: 1,
    identity: 1,
    labels: ['app=Receiver', 'namespace=ReceiverNs'],
    workloads: [],
    namespace: 'ReceiverNs',
    podName: `receiver-d4e5f6`,
  },
  sourceNamesList: [],
  destinationNamesList: [],
  nodeName: 'TestNode',
  reply: false,
  summary: '',
  type: FlowType.L34,
  time: {
    seconds: nowMs / 1000,
    nanos: nowMs * 1000000,
  },
  trafficDirection: TrafficDirection.Ingress,
  authType: AuthType.Disbaled,
};

export const icmpv6Flow: HubbleFlow = {
  ...icmpv4Flow,
  l4: {
    icmpv6: {
      code: 0,
      type: 0,
    },
  },
};

export const hubbleOne: HubbleFlow = {
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
    labels: ['app=Sender', 'namespace=SenderNs'],
    workloads: [{ kind: 'svc', name: 'sender' }],
    namespace: 'SenderNs',
    podName: `sender-a1b2c3`,
  },
  destination: {
    id: 1,
    identity: 1,
    labels: ['app=Receiver', 'namespace=ReceiverNs'],
    workloads: [{ kind: 'svc', name: 'receiver' }],
    namespace: 'ReceiverNs',
    podName: `receiver-d4e5f6`,
  },
  sourceNamesList: [],
  destinationNamesList: [],
  nodeName: 'TestNode',
  reply: false,
  summary: '',
  type: FlowType.L34,
  time: {
    seconds: nowMs / 1000,
    nanos: nowMs * 1000000,
  },
  trafficDirection: TrafficDirection.Ingress,
  authType: AuthType.Disbaled,
};

export const hubbleNoSourceName: HubbleFlow = {
  ...hubbleOne,
  source: {
    ...hubbleOne.source,
    labels: ['namespace=SenderNs'],
  } as Endpoint,
};

export const hubbleNoDstName: HubbleFlow = {
  ...hubbleOne,
  destination: {
    ...hubbleOne.destination,
    labels: ['namespace=ReceiverNs'],
  } as Endpoint,
};

export const hubbleNoSourceNamespace: HubbleFlow = {
  ...hubbleOne,
  source: {
    ...hubbleOne.source,
    labels: ['app=Sender'],
    namespace: '',
  } as Endpoint,
};

export const hubbleNoDstNamespace: HubbleFlow = {
  ...hubbleOne,
  destination: {
    ...hubbleOne.destination,
    labels: ['app=Receiver'],
    namespace: '',
  } as Endpoint,
};

export const hubbleDropped: HubbleFlow = {
  ...hubbleOne,
  verdict: Verdict.Dropped,
};

export const hubbleVerdictUnknown: HubbleFlow = {
  ...hubbleOne,
  verdict: Verdict.Unknown,
};

export const hubbleSameNamespace: HubbleFlow = {
  ...hubbleOne,
  source: {
    ...hubbleOne.source,
    labels: ['app=Sender', 'namespace=kube-system'],
    namespace: 'kube-system',
  } as Endpoint,
  destination: {
    ...hubbleOne.destination,
    labels: ['app=Receiver', 'namespace=kube-system'],
    namespae: 'kube-system',
  } as Endpoint,
};

export const hubbleWithHttp200: HubbleFlow = {
  ...hubbleOne,
  l7: {
    type: L7FlowType.Response,
    latencyNs: 52130,
    http: {
      code: 200,
      method: 'GET',
      url: '/',
      protocol: '1.1',
      headersList: [],
    },
  },
};

export const flowFromGoogle: HubbleFlow = {
  ...hubbleOne,
  sourceNamesList: ['www.google.com'],
};

export const flowToGoogle: HubbleFlow = {
  ...hubbleOne,
  destinationNamesList: ['www.google.com'],
};

export const flowFromToGoogle: HubbleFlow = {
  ...hubbleOne,
  sourceNamesList: ['www.google.com'],
  destinationNamesList: ['www.google.com'],
};

export const differentIps: HubbleFlow = {
  ...hubbleOne,
  ip: {
    source: '70.121.253.10',
    destination: '214.33.252.11',
    ipVersion: IPVersion.V4,
    encrypted: false,
  },
};

export const sameIps: HubbleFlow = {
  ...hubbleOne,
  ip: {
    source: '70.121.253.10',
    destination: '70.121.253.10',
    ipVersion: IPVersion.V4,
    encrypted: false,
  },
};

export const sameV6Ips: HubbleFlow = {
  ...hubbleOne,
  ip: {
    source: '::ffff:70.121.253.10',
    destination: '::ffff:70.121.253.10',
    ipVersion: IPVersion.V6,
    encrypted: false,
  },
};

export const fromKubeDNS: HubbleFlow = {
  ...hubbleOne,
  source: {
    ...hubbleOne.source,
    labels: [`${SpecialLabel.KubeDNS}`],
  } as Endpoint,
};

export const toKubeDNS: HubbleFlow = {
  ...hubbleOne,
  destination: {
    ...hubbleOne.destination,
    labels: [`${SpecialLabel.KubeDNS}`],
  } as Endpoint,
};

export const fromToKubeDNS: HubbleFlow = {
  ...hubbleOne,
  destination: {
    ...hubbleOne.destination,
    labels: [`${SpecialLabel.KubeDNS}`],
  } as Endpoint,
  source: {
    ...hubbleOne.source,
    labels: [`${SpecialLabel.KubeDNS}`],
  } as Endpoint,
};

export const toKubsDNS53: HubbleFlow = {
  ...toKubeDNS,
  l4: {
    udp: {
      destinationPort: 53,
      sourcePort: 56789,
    },
  },
};

export const fromHost: HubbleFlow = {
  ...hubbleOne,
  source: {
    ...hubbleOne.source,
    labels: [`${ReservedLabel.Host}=`],
  } as Endpoint,
};

export const toHost: HubbleFlow = {
  ...hubbleOne,
  destination: {
    ...hubbleOne.destination,
    labels: [`${ReservedLabel.Host}=`],
  } as Endpoint,
};

export const fromToHost: HubbleFlow = {
  ...hubbleOne,
  source: {
    ...hubbleOne.source,
    labels: [`${ReservedLabel.Host}=`],
  } as Endpoint,
  destination: {
    ...hubbleOne.destination,
    labels: [`${ReservedLabel.Host}=`],
  } as Endpoint,
};

export const normalOne: Flow = new Flow(hubbleOne);
