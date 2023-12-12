import { HubbleService } from '~/domain/hubble';
import { Labels, ReservedLabel, SpecialLabel, KV } from '~/domain/labels';
import { msToPbTimestamp } from '~/domain/helpers';

export enum MockServiceIdentity {
  World = 0,
  Host = 1,
  RemoteNode = 2,
  KubeDNS = 3,
  Regular1 = 4,
  Regular2 = 5,
}

const restOfService = {
  egressPolicyEnforced: false,
  ingressPolicyEnforced: false,
  visibilityPolicyStatus: '',
  creationTimestamp: msToPbTimestamp(+new Date(2020, 4, 15)),
};

export const regular: HubbleService = {
  id: 'regular-service-id',
  name: 'regular-service',
  namespace: 'service-ns',
  labels: [
    { key: 'k8s:k8s-app', value: 'regular-service' },
    { key: 'k8s:namespace', value: 'service-ns' },
    { key: 'lbl-key', value: 'random-value' },
  ],
  dnsNames: [],
  workloads: [{ kind: 'StatefulSets', name: 'regular' }],
  identity: MockServiceIdentity.Regular1,
  ...restOfService,
};

export const regular1: HubbleService = {
  id: 'regular1-service-id',
  name: 'regular1-service',
  namespace: 'service-ns',
  labels: [
    { key: 'k8s:k8s-app', value: 'regular1-service' },
    { key: 'k8s:namespace', value: 'service-ns' },
    { key: 'lbl-key', value: 'random-value' },
  ],
  dnsNames: [],
  workloads: [],
  identity: MockServiceIdentity.Regular1,
  ...restOfService,
};

export const world: HubbleService = {
  id: 'world-service',
  name: 'world-service',
  namespace: 'world-service-ns',
  labels: [Labels.toKV(ReservedLabel.World)],
  dnsNames: ['www.google.com'],
  workloads: [],
  identity: MockServiceIdentity.World,
  ...restOfService,
};

export const apiTwitter: HubbleService = {
  id: 'api.twitter.com',
  name: 'Twitter API',
  namespace: '',
  labels: [Labels.toKV(ReservedLabel.World)],
  dnsNames: ['api.twitter.com'],
  workloads: [],
  identity: MockServiceIdentity.World,
  ...restOfService,
};

export const host: HubbleService = {
  id: 'host-service',
  name: 'host-service',
  namespace: 'host-service-ns',
  labels: [Labels.toKV(ReservedLabel.Host)],
  dnsNames: [],
  workloads: [],
  identity: MockServiceIdentity.Host,
  ...restOfService,
};

export const remoteNode: HubbleService = {
  id: 'remote-node-service',
  name: 'remote-node-service',
  namespace: 'remote-node-service-ns',
  labels: [Labels.toKV(ReservedLabel.RemoteNode)],
  dnsNames: [],
  workloads: [],
  identity: MockServiceIdentity.RemoteNode,
  ...restOfService,
};

export const kubeDNS: HubbleService = {
  id: 'kube-dns-service',
  name: 'kube-dns-service',
  namespace: 'kube-dns-service-ns',
  labels: [Labels.toKV(SpecialLabel.KubeDNS)],
  dnsNames: [],
  workloads: [],
  identity: MockServiceIdentity.KubeDNS,
  ...restOfService,
};

const replaceNsLabel = (lbls: KV[], newNs = 'same-namespace') => {
  return lbls
    .filter(l => l.key != 'k8s:namespace')
    .concat([{ key: 'k8s:namespace', value: newNs }]);
};

export const sameNamespace = {
  regular: {
    ...regular,
    namespace: 'same-namespace',
    labels: replaceNsLabel(regular.labels),
  },
  regular1: {
    ...regular1,
    namespace: 'same-namespace',
    labels: replaceNsLabel(regular1.labels),
  },
  kubeDNS: {
    ...kubeDNS,
    namespace: 'same-namespace',
    labels: replaceNsLabel(kubeDNS.labels),
  },
};
