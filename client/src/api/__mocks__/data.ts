import range from 'lodash/range';

import * as dataHelpers from '~/domain/helpers';
import {
  FlowType,
  HubbleFlow,
  HubbleLink,
  HubbleService,
  IPProtocol,
  Verdict,
} from '~/domain/hubble';

export const selectedNamespace = 'jobs-demo';

export const links: HubbleLink[] = [
  {
    id: 'reserved:world:outgoing',
    sourceId: 'reserved:world:outgoing',
    destinationId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationPort: 443,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Forwarded,
  },
  {
    id: 'reserved:world:incoming:8080',
    sourceId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationId: 'reserved:world:incoming',
    destinationPort: 8080,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Forwarded,
  },
  {
    id: 'reserved:world:incoming:8080',
    sourceId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationId: 'reserved:world:incoming',
    destinationPort: 8080,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Dropped,
  },
  {
    id: 'reserved:world:incoming:443',
    sourceId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationId: 'reserved:world:incoming',
    destinationPort: 443,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Dropped,
  },
  {
    id: 'reserved:world:incoming:80',
    sourceId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationId: 'reserved:world:incoming',
    destinationPort: 80,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Forwarded,
  },
  {
    id: '1',
    sourceId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationId: '91085aa98c983e249442e887d70ebc568f4ef07b',
    destinationPort: 9981,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Forwarded,
  },
  {
    id: '2',
    sourceId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationId: 'ca111583bf9c9a3547c0c10aa5e77aa97d0e6a14',
    destinationPort: 9200,
    ipProtocol: IPProtocol.UDP,
    verdict: Verdict.Forwarded,
  },
  {
    id: '3',
    sourceId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationId: '5eee91c15081c2d4fac733c517ecb71ac095053a',
    destinationPort: 9092,
    ipProtocol: IPProtocol.ICMPv4,
    verdict: Verdict.Forwarded,
  },
  {
    id: '4',
    sourceId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationId: '3ccf93bf4b7a7e6b832bcfac1df78ddf26450a9e',
    destinationPort: 9982,
    ipProtocol: IPProtocol.ICMPv6,
    verdict: Verdict.Forwarded,
  },
  {
    id: '5',
    sourceId: '91085aa98c983e249442e887d70ebc568f4ef07b',
    destinationId: 'ca111583bf9c9a3547c0c10aa5e77aa97d0e6a14',
    destinationPort: 9201,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Forwarded,
  },
  {
    id: '6',
    sourceId: '872ihs09123iou897ykjashk291029oospi09123',
    destinationId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationPort: 9201,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Forwarded,
  },
  {
    id: '7',
    sourceId: 'k8sbkjh1279asjk980712375hsakfs98109822nj',
    destinationId: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    destinationPort: 9201,
    ipProtocol: IPProtocol.TCP,
    verdict: Verdict.Forwarded,
  },
];

export const services: HubbleService[] = [
  {
    id: '5306',
    name: 'identity-5306',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'pod-to-a-l3-denied-cnp',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128001,
      nanos: 405799623,
    },
  },
  {
    id: '21927',
    name: 'kube-dns',
    namespace: 'kube-system',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'coredns',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'kube-system',
      },
      {
        key: 'k8s:k8s-app',
        value: 'kube-dns',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128001,
      nanos: 405802007,
    },
  },
  {
    id: '5004',
    name: 'identity-5004',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'echo-a',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128001,
      nanos: 413628347,
    },
  },
  {
    id: '22992',
    name: 'identity-22992',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'pod-to-a-external-1111',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128001,
      nanos: 766815731,
    },
  },
  {
    id: '2',
    name: 'identity-2',
    namespace: '',
    labels: [
      {
        key: 'reserved:world',
        value: '',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128001,
      nanos: 766817549,
    },
  },
  {
    id: '53466',
    name: 'identity-53466',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'pod-to-b-intra-node',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128003,
      nanos: 8904197,
    },
  },
  {
    id: '42760',
    name: 'identity-42760',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'echo-b',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128003,
      nanos: 13080020,
    },
  },
  {
    id: '61243',
    name: 'identity-61243',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'pod-to-external-fqdn-allow-google-cnp',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128005,
      nanos: 669275364,
    },
  },
  {
    id: 'www.google.com',
    name: 'identity-www.google.com',
    namespace: '',
    labels: [
      {
        key: 'cidr:64.233.165.103/32',
        value: '',
      },
      {
        key: 'reserved:world',
        value: '',
      },
    ],
    dnsNames: ['www.google.com'],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128005,
      nanos: 707161009,
    },
  },
  {
    id: '62455',
    name: 'identity-62455',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'pod-to-b-intra-node-nodeport',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128006,
      nanos: 635730064,
    },
  },
  {
    id: '4113',
    name: 'identity-4113',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'pod-to-a-allowed-cnp',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128010,
      nanos: 25178104,
    },
  },
  {
    id: '30846',
    name: 'identity-30846',
    namespace: 'default',
    labels: [
      {
        key: 'k8s:io.cilium.k8s.policy.cluster',
        value: 'default',
      },
      {
        key: 'k8s:io.cilium.k8s.policy.serviceaccount',
        value: 'default',
      },
      {
        key: 'k8s:io.kubernetes.pod.namespace',
        value: 'default',
      },
      {
        key: 'k8s:name',
        value: 'pod-to-a',
      },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '',
    creationTimestamp: {
      seconds: 1594128010,
      nanos: 419988394,
    },
  },
];

export const flows: HubbleFlow[] = range(100).map(
  (): HubbleFlow => {
    return {
      source: {
        id: 0,
        identity: 0,
        labelsList: ['app=kafka'],
        namespace: 'kube-system',
        podName: `kafka-${Math.random() * 10}`,
      },
      time: {
        seconds: Date.now() + Math.random(),
        nanos: Date.now() + Math.random(),
      },
      destination: {
        id: 1,
        identity: 1,
        labelsList: ['app=loader'],
        namespace: 'kube-system',
        podName: `loader-${Math.random() * 10}`,
      },
      destinationNamesList: [],
      dropReason: 0,
      nodeName: '',
      reply: false,
      sourceNamesList: [],
      summary: '',
      type: FlowType.L34,
      l4: {
        tcp: {
          destinationPort: Math.random() <= 0.5 ? 80 : 443,
          sourcePort: Math.random() * 5000,
        },
      },
      verdict: Math.random() <= 0.5 ? Verdict.Forwarded : Verdict.Dropped,
    };
  },
);
