import _ from 'lodash';

import { FlowType, IFlow, Verdict } from '~/domain/hubble';
import { Link, Service } from '~/domain/service-map';

export const links: Array<Link> = [];

export const endpoints: Array<Service> = [
  {
    id: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    name: 'coreapi',
    namespace: 'default',
    labels: [
      { key: 'k8s:app', value: 'coreapi' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '?unknown?',
    creationTimestamp: Date.now(),
  },
  {
    id: '91085aa98c983e249442e887d70ebc568f4ef07b',
    name: 'crawler',
    namespace: 'default',
    labels: [
      { key: 'k8s:app', value: 'crawler' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    dnsNames: [],
    egressPolicyEnforced: true,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '?unknown?',
    creationTimestamp: Date.now(),
  },
  {
    id: 'ca111583bf9c9a3547c0c10aa5e77aa97d0e6a14',
    name: 'elasticsearch',
    namespace: 'default',
    labels: [
      { key: 'k8s:app', value: 'elasticsearch' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: true,
    visibilityPolicyStatus: '?unknown?',
    creationTimestamp: Date.now(),
  },
  {
    id: 'd2f41b3210a1447bae8f194e1f611793e381a4f0',
    name: 'jobposting',
    namespace: 'default',
    labels: [
      { key: 'k8s:app.kubernetes.io/name', value: 'ydz' },
      { key: 'k8s:app', value: 'jobposting' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    dnsNames: [],
    egressPolicyEnforced: true,
    ingressPolicyEnforced: true,
    visibilityPolicyStatus: '?unknown?',
    creationTimestamp: Date.now(),
  },
  {
    id: '5eee91c15081c2d4fac733c517ecb71ac095053a',
    name: 'kafka',
    namespace: 'default',
    labels: [
      { key: 'k8s:app', value: 'kafka' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
      { key: 'k8s:statefulset.kubernetes.io/pod-name', value: 'kafka-0' },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '?unknown?',
    creationTimestamp: Date.now(),
  },
  {
    id: 'a31f0187f650569a41eb9ddd48ca470c96c7d753',
    name: 'loader',
    namespace: 'default',
    labels: [
      { key: 'k8s:app', value: 'loader' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    dnsNames: [],
    egressPolicyEnforced: true,
    ingressPolicyEnforced: true,
    visibilityPolicyStatus: '?unknown?',
    creationTimestamp: Date.now(),
  },
  {
    id: '3ccf93bf4b7a7e6b832bcfac1df78ddf26450a9e',
    name: 'recruiter',
    namespace: 'default',
    labels: [
      { key: 'k8s:app', value: 'recruiter' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    dnsNames: [],
    egressPolicyEnforced: false,
    ingressPolicyEnforced: true,
    visibilityPolicyStatus: '?unknown?',
    creationTimestamp: Date.now(),
  },
  {
    id: '669333a2d60b773d01e9a73837cd92fac3d9ecf0',
    name: 'zookeeper',
    namespace: 'default',
    labels: [
      { key: 'k8s:app', value: 'zookeeper' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    dnsNames: [],
    egressPolicyEnforced: true,
    ingressPolicyEnforced: false,
    visibilityPolicyStatus: '?unknown?',
    creationTimestamp: Date.now(),
  },
];

export const flows: Array<IFlow> = _.range(100).map(() => {
  return {
    source: {
      id: 0,
      identity: 0,
      labelsList: ['app=kafka'],
      namespace: 'kube-system',
      podName: `kafka-${Math.random() * 10}`,
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
});
