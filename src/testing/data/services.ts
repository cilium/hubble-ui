import { HubbleService, IPProtocol, Verdict } from '~/domain/hubble';
import { Link } from '~/domain/link';
import { Labels, ReservedLabel, SpecialLabel } from '~/domain/labels';
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

export const world: HubbleService = {
  id: 'world-service',
  name: 'world-service',
  namespace: 'world-service-ns',
  labels: [Labels.toKV(ReservedLabel.World)],
  dnsNames: ['www.google.com'],
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
