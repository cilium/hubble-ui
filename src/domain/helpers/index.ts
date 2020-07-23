// TODO: its probably not a good place for such helpers
// consider moving it outside of domain types

import {
  Flow as PBFlow,
  IPVersion as PBIPVersion,
  Ethernet as PBEthernet,
  IP as PBIP,
  Layer4 as PBLayer4,
  Layer7 as PBLayer7,
  TCP as PBTCP,
  UDP as PBUDP,
  ICMPv4 as PBICMPv4,
  ICMPv6 as PBICMPv6,
  TCPFlags as PBTCPFlags,
  Endpoint as PBEndpoint,
  FlowType as PBFlowType,
  L7FlowType as PBL7FlowType,
  TrafficDirection as PBTrafficDirection,
  CiliumEventType as PBCiliumEventType,
  Service as PBService,
} from '~backend/proto/flow/flow_pb';

import {
  HubbleFlow,
  IPVersion,
  IP,
  Ethernet,
  Layer4,
  Layer7,
  TCP,
  UDP,
  ICMPv4,
  ICMPv6,
  TCPFlags,
  Endpoint,
  FlowType,
  L7FlowType,
  CiliumEventType,
  Service as FlowService,
  Time,
  HubbleService,
  HubbleLink,
  IPProtocol,
  TrafficDirection,
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
export * from './verdict';

export const hubbleFlowFromPb = (flow: PBFlow): HubbleFlow => {
  let time: any = void 0;

  if (flow.hasTime()) {
    const timeObj = flow.getTime()!.toObject();

    time = {
      seconds: timeObj.seconds,
      nanos: timeObj.nanos,
    };
  }

  const verdict = verdictHelpers.verdictFromPb(flow.getVerdict());
  const ethernet = ethernetFromPb(flow.getEthernet());
  const ip = ipFromPb(flow.getIp());
  const l4 = l4FromPb(flow.getL4());
  const source = endpointFromPb(flow.getSource());
  const destination = endpointFromPb(flow.getDestination());
  const type = flowTypeFromPb(flow.getType());
  const l7 = l7FromPb(flow.getL7());
  const eventType = ciliumEventTypeFromPb(flow.getEventType());
  const sourceService = flowServiceFromPb(flow.getSourceService());
  const destinationService = flowServiceFromPb(flow.getDestinationService());
  const trafficDirection = trafficDirectionFromPb(flow.getTrafficDirection());

  return {
    time,
    verdict,
    dropReason: flow.getDropReason(),
    ethernet,
    ip,
    l4,
    source,
    destination,
    type,
    nodeName: flow.getNodeName(),
    sourceNamesList: flow.getSourceNamesList(),
    destinationNamesList: flow.getDestinationNamesList(),
    l7,
    reply: flow.getReply(),
    eventType,
    sourceService,
    destinationService,
    summary: flow.getSummary(),
    trafficDirection,
  };
};

export const flowServiceFromPb = (
  svc: PBService | undefined,
): FlowService | undefined => {
  return svc == null ? undefined : svc!.toObject();
};

export const ciliumEventTypeFromPb = (
  cet: PBCiliumEventType | undefined,
): CiliumEventType | undefined => {
  return cet == null ? undefined : cet!.toObject();
};

export const l7FromPb = (l7: PBLayer7 | undefined): Layer7 | undefined => {
  if (l7 == null) return undefined;

  const obj = {
    type: l7FlowTypeFromPb(l7.getType()),
    latencyNs: l7.getLatencyNs(),
    dns: l7.hasDns() ? l7.getDns()!.toObject() : undefined,
    http: l7.hasHttp() ? l7.getHttp()!.toObject() : undefined,
    kafka: l7.hasKafka() ? l7.getKafka()!.toObject() : undefined,
  };

  return obj;
};

export const l7FlowTypeFromPb = (pb: PBL7FlowType): L7FlowType => {
  let ft = L7FlowType.Unknown;

  if (pb === PBL7FlowType.REQUEST) {
    ft = L7FlowType.Request;
  } else if (pb === PBL7FlowType.RESPONSE) {
    ft = L7FlowType.Response;
  } else if (pb === PBL7FlowType.SAMPLE) {
    ft = L7FlowType.Sample;
  }

  return ft;
};

export const trafficDirectionFromPb = (
  pb: PBTrafficDirection,
): TrafficDirection => {
  let dir = TrafficDirection.Unknown;

  if (pb === PBTrafficDirection.INGRESS) {
    dir = TrafficDirection.Ingress;
  } else if (pb === PBTrafficDirection.EGRESS) {
    dir = TrafficDirection.Egress;
  }

  return dir;
};

export const flowTypeFromPb = (ft: PBFlowType): FlowType => {
  let t = FlowType.Unknown;

  if (ft === PBFlowType.L3_L4) {
    t = FlowType.L34;
  } else if (ft === PBFlowType.L7) {
    t = FlowType.L7;
  }

  return t;
};

export const endpointFromPb = (
  ep: PBEndpoint | undefined,
): Endpoint | undefined => {
  return ep == null ? undefined : ep.toObject();
};

export const ethernetFromPb = (
  e: PBEthernet | undefined,
): Ethernet | undefined => {
  if (e == null) return undefined;

  return e!.toObject();
};

export const ipFromPb = (ip: PBIP | undefined): IP | undefined => {
  if (ip == null) return undefined;

  let ipVersion = IPVersion.NotUsed;
  const fipVersion = ip.getIpversion();

  if (fipVersion === PBIPVersion.IPV4) {
    ipVersion = IPVersion.V4;
  } else if (fipVersion == PBIPVersion.IPV6) {
    ipVersion = IPVersion.V6;
  }

  return { ...ip.toObject(), ipVersion };
};

export const l4FromPb = (l4: PBLayer4 | undefined): Layer4 | undefined => {
  if (l4 == null) return undefined;

  let tcp: TCP | undefined = undefined;
  let udp: UDP | undefined = undefined;
  let icmpv4: ICMPv4 | undefined = undefined;
  let icmpv6: ICMPv6 | undefined = undefined;

  if (l4.hasTcp()) {
    tcp = tcpFromPb(l4.getTcp()!);
  }

  if (l4.hasUdp()) {
    udp = udpFromPb(l4.getUdp()!);
  }

  if (l4.hasIcmpv4()) {
    icmpv4 = icmpv4FromPb(l4.getIcmpv4()!);
  }

  if (l4.hasIcmpv6()) {
    icmpv6 = icmpv6FromPb(l4.getIcmpv6()!);
  }

  return { tcp, udp, icmpv4, icmpv6 };
};

export const tcpFromPb = (tcp: PBTCP): TCP => {
  return {
    sourcePort: tcp.getSourcePort(),
    destinationPort: tcp.getDestinationPort(),
    flags: tcp.hasFlags() ? tcpFlagsFromPb(tcp.getFlags()!) : void 0,
  };
};

export const tcpFlagsFromPb = (flags: PBTCPFlags): TCPFlags => {
  return flags.toObject();
};

export const udpFromPb = (udp: PBUDP): UDP => {
  return udp.toObject();
};

export const icmpv4FromPb = (icmp: PBICMPv4): ICMPv4 => {
  return icmp.toObject();
};

export const icmpv6FromPb = (icmp: PBICMPv6): ICMPv6 => {
  return icmpv4FromPb(icmp);
};

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
