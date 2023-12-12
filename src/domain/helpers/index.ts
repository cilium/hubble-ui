// TODO: its probably not a good place for such helpers
// consider moving it outside of domain types

import { Time, HubbleService, HubbleLink, IPProtocol, Latency } from '~/domain/hubble';

import * as uipb from '~backend/proto/ui/ui_pb';

import { StateChange } from '~/domain/misc';
import { Labels } from '~/domain/labels';

import { authTypeFromPb } from './auth-type';
import * as verdict from './verdict';
export { verdict };

import * as notifications from './notifications';
export { notifications };

import * as flows from './flows';
export { flows };

import * as time from './time';
export { time };

export * as tcpFlags from './tcp-flags';
export * as protocol from './protocol';
export * as namespaces from './namespaces';
export * as link from './link';
export * as l7 from './l7';
export * as workload from './workload';

export const stateChangeFromPb = (change: uipb.StateChange): StateChange => {
  switch (change) {
    case uipb.StateChange.ADDED:
      return StateChange.Added;
    case uipb.StateChange.MODIFIED:
      return StateChange.Modified;
    case uipb.StateChange.DELETED:
      return StateChange.Deleted;
    case uipb.StateChange.EXISTS:
      return StateChange.Exists;
  }

  return StateChange.Unknown;
};

export const relayServiceFromPb = (svc: uipb.Service): HubbleService => {
  return {
    id: svc.id,
    name: svc.name,
    namespace: svc.namespace,
    labels: Labels.labelsToKV(svc.labels, false),
    dnsNames: svc.dnsNames,
    egressPolicyEnforced: svc.egressPolicyEnforced,
    ingressPolicyEnforced: svc.ingressPolicyEnforced,
    visibilityPolicyStatus: svc.visibilityPolicyStatus,
    creationTimestamp: svc.creationTimestamp ?? msToPbTimestamp(Date.now()),
    workloads: svc.workloads,
    identity: svc.identity,
  };
};

export const relayServiceLinkFromPb = (link: uipb.ServiceLink): HubbleLink => {
  return {
    id: link.id,
    sourceId: link.sourceId,
    destinationId: link.destinationId,
    destinationPort: link.destinationPort,
    ipProtocol: ipProtocolFromPb(link.ipProtocol),
    verdict: verdict.verdictFromPb(link.verdict),
    flowAmount: link.flowAmount,
    bytesTransfered: link.bytesTransfered,
    latency: latencyFromPb(link.latency),
    authType: authTypeFromPb(link.authType),
    isEncrypted: link.isEncrypted,
  };
};

export const latencyFromPb = (lat?: uipb.ServiceLink_Latency | null): Latency => {
  return {
    min: time.fromDuration(lat?.min) ?? time.zero(),
    max: time.fromDuration(lat?.max) ?? time.zero(),
    avg: time.fromDuration(lat?.avg) ?? time.zero(),
  };
};

export const ipProtocolFromPb = (ipp: uipb.IPProtocol): IPProtocol => {
  switch (ipp) {
    case uipb.IPProtocol.TCP:
      return IPProtocol.TCP;
    case uipb.IPProtocol.UDP:
      return IPProtocol.UDP;
    case uipb.IPProtocol.ICMP_V4:
      return IPProtocol.ICMPv4;
    case uipb.IPProtocol.ICMP_V6:
      return IPProtocol.ICMPv6;
  }

  return IPProtocol.Unknown;
};

export const msToPbTimestamp = (ms: number): Time => {
  const seconds = (ms / 1000) | 0;
  const nanos = (ms - seconds * 1000) * 1e6;

  return { seconds, nanos };
};
