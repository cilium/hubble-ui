// TODO: its probably not a good place for such helpers
// consider moving it outside of domain types
import {
  HubbleFlow,
  Time,
  HubbleService,
  HubbleLink,
  IPProtocol,
} from '~/domain/hubble';

import {
  Service as PBRelayService,
  ServiceLink as PBRelayServiceLink,
  IPProtocol as PBIPProtocol,
  StateChange as PBStateChange,
} from '~backend/proto/ui/ui_pb';

import { StateChange } from '~/domain/misc';
import { KV } from '~/domain/misc';
import { Flow } from '~/domain/flows';

import * as verdictHelpers from './verdict';
export { verdictHelpers as verdict };

import * as notifications from './notifications';
export { notifications };

import * as flows from './flows';
export { flows };

import * as tcpFlags from './tcp-flags';
export { tcpFlags };

import * as protocol from './protocol';
export { protocol };

import * as l7 from './l7';
export { l7 };

export * as time from './time';

export const stateChangeFromPb = (change: PBStateChange): StateChange => {
  switch (change) {
    case PBStateChange.ADDED:
      return StateChange.Added;
    case PBStateChange.MODIFIED:
      return StateChange.Modified;
    case PBStateChange.DELETED:
      return StateChange.Deleted;
    case PBStateChange.EXISTS:
      return StateChange.Exists;
  }

  return StateChange.Unknown;
};

export const relayServiceFromPb = (svc: PBRelayService): HubbleService => {
  const obj = svc.toObject();
  const labels: Array<KV> = [];

  obj.labelsList.forEach(l => {
    const parts = l.split('=');

    const key = parts[0];
    const value = parts.slice(1).join('=');

    labels.push({ key, value });
  });

  return {
    id: obj.id,
    name: obj.name,
    namespace: obj.namespace,
    labels,
    dnsNames: obj.dnsNamesList,
    egressPolicyEnforced: obj.egressPolicyEnforced,
    ingressPolicyEnforced: obj.ingressPolicyEnforced,
    visibilityPolicyStatus: obj.visibilityPolicyStatus,
    creationTimestamp: obj.creationTimestamp ?? msToPbTimestamp(Date.now()),
  };
};

export const relayServiceLinkFromPb = (
  link: PBRelayServiceLink,
): HubbleLink => {
  const obj = link.toObject();

  return {
    id: obj.id,
    sourceId: obj.sourceId,
    destinationId: obj.destinationId,
    destinationPort: obj.destinationPort,
    ipProtocol: ipProtocolFromPb(obj.ipProtocol),
    verdict: verdictHelpers.verdictFromPb(obj.verdict),
  };
};

export const ipProtocolFromPb = (ipp: PBIPProtocol): IPProtocol => {
  switch (ipp) {
    case PBIPProtocol.TCP:
      return IPProtocol.TCP;
    case PBIPProtocol.UDP:
      return IPProtocol.UDP;
    case PBIPProtocol.ICMP_V4:
      return IPProtocol.ICMPv4;
    case PBIPProtocol.ICMP_V6:
      return IPProtocol.ICMPv6;
  }

  return IPProtocol.Unknown;
};

export const msToPbTimestamp = (ms: number): Time => {
  const seconds = (ms / 1000) | 0;
  const nanos = (ms - seconds * 1000) * 1e6;

  return { seconds, nanos };
};

export const flowFromRelay = (hubbleFlow: HubbleFlow): Flow => {
  return new Flow(hubbleFlow);
};
