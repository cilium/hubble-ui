import { IEndpoint } from '~/domain/endpoint';
import { ServiceMap, Link } from '~/domain/service-map';
import { reserved } from '~/domain/cilium';
import { L34Protocol } from '~/domain/mocked-data';

export const links: Array<Link> = [
  {
    sourceIdentity: String(reserved.world.id),
    destinationIdentity: 'a31f0187f650569a41eb9ddd48ca470c96c7d753',
    destinationPort: 443,
    l34Protocol: L34Protocol.TCP,
  },
];

export const endpoints: Array<IEndpoint> = [
  {
    id: 'a8de92d55119c9a6bb6a6dd66bcf012fabefb32d',
    labels: [
      { key: 'k8s:app', value: 'coreapi' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    egressEnforcement: false,
    ingressEnforcement: false,
    visibilityPolicy: false,
  },
  {
    id: '91085aa98c983e249442e887d70ebc568f4ef07b',
    labels: [
      { key: 'k8s:app', value: 'crawler' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    egressEnforcement: true,
    ingressEnforcement: false,
    visibilityPolicy: false,
  },
  {
    id: 'ca111583bf9c9a3547c0c10aa5e77aa97d0e6a14',
    labels: [
      { key: 'k8s:app', value: 'elasticsearch' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    egressEnforcement: false,
    ingressEnforcement: true,
    visibilityPolicy: false,
  },
  {
    id: 'd2f41b3210a1447bae8f194e1f611793e381a4f0',
    labels: [
      { key: 'k8s:app.kubernetes.io/name', value: 'ydz' },
      { key: 'k8s:app', value: 'jobposting' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    egressEnforcement: true,
    ingressEnforcement: true,
    visibilityPolicy: false,
  },
  {
    id: '5eee91c15081c2d4fac733c517ecb71ac095053a',
    labels: [
      { key: 'k8s:app', value: 'kafka' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
      { key: 'k8s:statefulset.kubernetes.io/pod-name', value: 'kafka-0' },
    ],
    egressEnforcement: false,
    ingressEnforcement: false,
    visibilityPolicy: true,
  },
  {
    id: 'a31f0187f650569a41eb9ddd48ca470c96c7d753',
    labels: [
      { key: 'k8s:app', value: 'loader' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    egressEnforcement: true,
    ingressEnforcement: true,
    visibilityPolicy: true,
  },
  {
    id: '3ccf93bf4b7a7e6b832bcfac1df78ddf26450a9e',
    labels: [
      { key: 'k8s:app', value: 'recruiter' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    egressEnforcement: false,
    ingressEnforcement: true,
    visibilityPolicy: true,
  },
  {
    id: '669333a2d60b773d01e9a73837cd92fac3d9ecf0',
    labels: [
      { key: 'k8s:app', value: 'zookeeper' },
      { key: 'k8s:io.cilium.k8s.policy.cluster', value: 'default' },
      { key: 'k8s:io.cilium.k8s.policy.serviceaccount', value: 'default' },
      { key: 'k8s:io.kubernetes.pod.namespace', value: 'jobs-demo' },
    ],
    egressEnforcement: true,
    ingressEnforcement: false,
    visibilityPolicy: true,
  },
];

export const serviceMap: ServiceMap = {
  endpoints,
  links,
};
