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
  DNS,
  HTTP,
  ICMPv4,
  ICMPv6,
  TCPFlags,
  Endpoint,
  FlowType,
  L7FlowType,
  CiliumEventType,
  Service as FlowService,
  Time,
  TrafficDirection,
  AuthType,
} from '~/domain/hubble';

import * as misc from '~/domain/misc';

import * as verdictHelpers from './verdict';
import { authTypeFromPb } from './auth-type';

export const hubbleFlowFromObj = (obj: any): HubbleFlow | null => {
  obj = obj.flow != null ? obj.flow : obj;

  // NOTE: sanity check
  if (obj.verdict == null && obj.nodeName == null) return null;

  const time = isoTimeToHubbleTime(obj.time) ?? void 0;
  const verdict = verdictHelpers.verdictFromStr(obj.verdict);

  const ethernet =
    obj.ethernet != null
      ? {
          source: obj.ethernet.source,
          destination: obj.ethernet.destination,
        }
      : void 0;

  const ip = ipFromObj(obj.ip) ?? void 0;
  const source = endpointFromObj(obj.source) ?? void 0;
  const destination = endpointFromObj(obj.destination) ?? void 0;
  const l4 = l4FromObj(obj.l4) ?? void 0;
  const type = flowTypeFromStr(obj.type);
  const l7 = l7FromObj(obj.l7) ?? void 0;
  const eventType: CiliumEventType | undefined =
    obj.eventType != null
      ? {
          type: obj.eventType.type,
          subType: obj.eventType.subType,
        }
      : void 0;

  const sourceService = flowServiceFromObj(obj.sourceService) ?? void 0;
  const destinationService =
    flowServiceFromObj(obj.destinationService) ?? void 0;
  const trafficDirection = trafficDirectionFromStr(obj.trafficDirection);
  const authType = authTypeFromStr(obj.authType);

  return {
    time,
    verdict,
    dropReason: obj.dropReason,
    ethernet,
    ip,
    l4,
    source,
    destination,
    type,
    nodeName: obj.nodeName,
    sourceNamesList: obj.sourceNamesList ?? [],
    destinationNamesList: obj.destinationNamesList ?? [],
    l7,
    reply: !!obj.reply,
    eventType,
    sourceService,
    destinationService,
    summary: obj.summary,
    trafficDirection,
    authType,
  };
};

export const isoTimeToHubbleTime = (t: string | null): Time | null => {
  if (!t) return null;

  const d = new Date(t);
  if (!misc.isValidDate(d)) return null;

  const ms = +d;
  const seconds = (ms / 1000) | 0;
  // WARN: precision lost accumulates here
  const nanos = (ms / 1000 - seconds) * 1e9;

  return { seconds, nanos };
};

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
  const authType = authTypeFromPb(flow.getAuthType());

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
    authType,
  };
};

export const flowServiceFromPb = (
  svc: PBService | undefined,
): FlowService | undefined => {
  return svc == null ? undefined : svc!.toObject();
};

export const flowServiceFromObj = (obj: any): FlowService | null => {
  if (obj == null) return null;

  return {
    name: obj.name,
    namespace: obj.namespace,
  };
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
    http: l7.hasHttp() ? l7httpFromObj(l7.getHttp()?.toObject())! : undefined,
    kafka: l7.hasKafka() ? l7.getKafka()!.toObject() : undefined,
  };

  return obj;
};

export const l7FromObj = (l7: any): Layer7 | null => {
  if (l7 == null) return null;

  return {
    type: l7FlowTypeFromStr(l7.type),
    latencyNs: l7.latencyNs,
    http: l7httpFromObj(l7.http) ?? void 0,
    dns: l7dnsFromObj(l7.dns) ?? void 0,
    kafka: l7.kafka,
  };
};

export const l7httpFromObj = (obj: any): HTTP | null => {
  if (obj == null) return null;

  return {
    code: obj.code,
    method: obj.method,
    url: obj.url,
    protocol: obj.protocol,
    headersList: obj.headersList ?? obj.headers,
  };
};

export const l7dnsFromObj = (dns: any): DNS | null => {
  if (!dns) return null;

  return {
    query: dns.query,
    ipsList: dns.ips ?? dns.ipsList,
    ttl: dns.ttl ? parseInt(dns.ttl, 10) : 0,
    cnamesList: dns.cnames ?? dns.cnamesList,
    observationSource: dns.observationSource,
    qtypesList: dns.qtypes ?? dns.qtypesList,
    rrtypesList: dns.rrtypes ?? dns.rrtypesList,
    rcode: dns.rcode ?? -1,
  };
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

export const l7FlowTypeFromStr = (str: string): L7FlowType => {
  let ft = L7FlowType.Unknown;
  if (!str) return ft;

  str = str.toLowerCase();

  if (str.startsWith('request')) {
    ft = L7FlowType.Request;
  } else if (str.startsWith('response')) {
    ft = L7FlowType.Response;
  } else if (str.startsWith('sample')) {
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

export const trafficDirectionFromStr = (str: string): TrafficDirection => {
  let dir = TrafficDirection.Unknown;
  if (!str) return dir;
  str = str.toLowerCase();

  if (str.startsWith('ingress')) {
    dir = TrafficDirection.Ingress;
  } else if (str.startsWith('egress')) {
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

export const flowTypeFromStr = (str: string): FlowType => {
  let t = FlowType.Unknown;

  if (!str) return t;
  str = str.toLowerCase();

  if (str.startsWith('l3_l4')) t = FlowType.L34;
  if (str.startsWith('l7')) t = FlowType.L7;

  return t;
};

export const authTypeFromStr = (str: string): AuthType => {
  let t = AuthType.Disbaled;

  if (!str) return t;
  str = str.toLowerCase();

  if (str.startsWith('spire')) t = AuthType.Spire;
  if (str.startsWith('test')) t = AuthType.TestAlwaysFail;

  return t;
};

export const endpointFromPb = (
  ep: PBEndpoint | undefined,
): Endpoint | undefined => {
  return ep == null ? undefined : ep.toObject();
};

export const endpointFromObj = (obj: any): Endpoint | null => {
  if (obj == null) return null;

  return {
    id: obj.id,
    identity: obj.identity,
    namespace: obj.namespace,
    labelsList: (obj.labels || obj.labelsList || []).slice(),
    podName: obj.podName,
  };
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

export const ipFromObj = (ip: any | null): IP | null => {
  if (ip == null) return null;

  const ipVersion = ipVersionFromStr(ip.ipVersion);

  return {
    source: ip.source,
    destination: ip.destination,
    ipVersion,
    encrypted: !!ip.encrypted,
  };
};

export const ipVersionFromStr = (ipv: string): IPVersion => {
  if (!ipv) return IPVersion.NotUsed;
  ipv = ipv.toLowerCase();

  if (ipv.startsWith('ipv4')) return IPVersion.V4;
  if (ipv.startsWith('ipv6')) return IPVersion.V6;

  return IPVersion.NotUsed;
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

export const l4FromObj = (l4: any): Layer4 | null => {
  if (l4 == null) return null;
  const parsed: Layer4 = {};

  const icmpv4 = l4.icmPv4 ?? l4.ICMPv4 ?? l4.icmpv4 ?? l4.icmpV4;
  const icmpv6 = l4.icmPv6 ?? l4.ICMPv6 ?? l4.icmpv6 ?? l4.icmpV6;

  if (l4.tcp != null && l4.tcp.flags != null) {
    parsed.tcp = {
      sourcePort: l4.tcp.sourcePort,
      destinationPort: l4.tcp.destinationPort,
      flags: tcpFlagsFromObject(l4.tcp.flags)!,
    };
  }

  if (l4.udp != null) {
    parsed.udp = {
      sourcePort: l4.udp.sourcePort,
      destinationPort: l4.udp.destinationPort,
    };
  }

  if (icmpv4 != null) {
    parsed.icmpv4 = {
      type: icmpv4.type,
      code: icmpv4.code,
    };
  }

  if (icmpv6 != null) {
    parsed.icmpv6 = {
      type: icmpv6.type,
      code: icmpv6.code,
    };
  }

  return parsed;
};

export const tcpFlagsFromObject = (obj: any | PBTCPFlags): TCPFlags | null => {
  if (obj == null) return null;

  if (obj.toObject != null) obj = obj.toObject();

  return {
    fin: !!obj.fin || !!obj['FIN'],
    syn: !!obj.syn || !!obj['SYN'],
    rst: !!obj.rst || !!obj['RST'],
    psh: !!obj.psh || !!obj['PSH'],
    ack: !!obj.ack || !!obj['ACK'],
    urg: !!obj.urg || !!obj['URG'],
    ece: !!obj.ece || !!obj['ECE'],
    cwr: !!obj.cwr || !!obj['CWR'],
    ns: !!obj.ns || !!obj['NS'],
  };
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
