import { Flow } from '~/domain/flows';
import { HubbleFlow, Verdict, FlowType, Endpoint } from '~/domain/hubble';

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
    labelsList: ['app=Sender', 'namespace=SenderNs'],
    namespace: 'kube-system',
    podName: `sender-a1b2c3`,
  },
  destination: {
    id: 1,
    identity: 1,
    labelsList: ['app=Receiver', 'namespace=ReceiverNs'],
    namespace: 'kube-system',
    podName: `receiver-d4e5f6`,
  },
  sourceNamesList: [],
  destinationNamesList: [],
  nodeName: 'TestNode',
  reply: false,
  summary: '',
  type: FlowType.L34,
};

export const hubbleNoSourceName: HubbleFlow = {
  ...hubbleOne,
  source: {
    ...hubbleOne.source,
    labelsList: ['namespace=SenderNs'],
  } as Endpoint,
};

export const hubbleNoDstName: HubbleFlow = {
  ...hubbleOne,
  destination: {
    ...hubbleOne.destination,
    labelsList: ['namespace=ReceiverNs'],
  } as Endpoint,
};

export const hubbleNoSourceNamespace: HubbleFlow = {
  ...hubbleOne,
  source: {
    ...hubbleOne.source,
    labelsList: ['app=Sender'],
  } as Endpoint,
};

export const hubbleNoDstNamespace: HubbleFlow = {
  ...hubbleOne,
  destination: {
    ...hubbleOne.destination,
    labelsList: ['app=Receiver'],
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

export const normalOne: Flow = new Flow(hubbleOne);
