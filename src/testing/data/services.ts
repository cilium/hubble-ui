import { HubbleService, IPProtocol, Verdict } from '~/domain/hubble';
import { Link } from '~/domain/link';
import { Labels, ReservedLabel, SpecialLabel, KV } from '~/domain/labels';
import { msToPbTimestamp } from '~/domain/helpers';

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
  ...restOfService,
};

export const world: HubbleService = {
  id: 'world-service',
  name: 'world-service',
  namespace: 'world-service-ns',
  labels: [Labels.toKV(ReservedLabel.World)],
  dnsNames: ['www.google.com'],
  ...restOfService,
};

export const apiTwitter: HubbleService = {
  id: 'api.twitter.com',
  name: 'Twitter API',
  namespace: '',
  labels: [Labels.toKV(ReservedLabel.World)],
  dnsNames: ['api.twitter.com'],
  ...restOfService,
};

export const host: HubbleService = {
  id: 'host-service',
  name: 'host-service',
  namespace: 'host-service-ns',
  labels: [Labels.toKV(ReservedLabel.Host)],
  dnsNames: [],
  ...restOfService,
};

export const remoteNode: HubbleService = {
  id: 'remote-node-service',
  name: 'remote-node-service',
  namespace: 'remote-node-service-ns',
  labels: [Labels.toKV(ReservedLabel.RemoteNode)],
  dnsNames: [],
  ...restOfService,
};

export const kubeDNS: HubbleService = {
  id: 'kube-dns-service',
  name: 'kube-dns-service',
  namespace: 'kube-dns-service-ns',
  labels: [Labels.toKV(SpecialLabel.KubeDNS)],
  dnsNames: [],
  ...restOfService,
};

export const kubeApiServer: HubbleService = {
  id: 'kube-apiserver',
  name: 'kube-apiserver',
  namespace: 'kube-apiserver-ns',
  labels: [Labels.toKV(ReservedLabel.KubeApiServer)],
  dnsNames: [],
  ...restOfService,
};

export const worldKubeApiServer: HubbleService = {
  id: 'kube-apiserver',
  name: 'kube-apiserver',
  namespace: 'kube-apiserver-ns',
  labels: [
    Labels.toKV(ReservedLabel.KubeApiServer),
    Labels.toKV(ReservedLabel.World),
  ],
  dnsNames: [],
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
