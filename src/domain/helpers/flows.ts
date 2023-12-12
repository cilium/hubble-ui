import _ from 'lodash';
import * as flowpb from '~backend/proto/flow/flow_pb';

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

export const hubbleFlowFromLogEntry = (entry: string | object): HubbleFlow | null => {
  if (entry == null) return null;

  let obj: any = entry;
  if (typeof entry === 'string') {
    try {
      obj = JSON.parse(entry);
    } catch (e) {
      return null;
    }
  }

  const parsed = misc.camelCasify(obj);
  return hubbleFlowFromObj(parsed);
};

export const hubbleFlowFromObj = (obj: any): HubbleFlow | null => {
  obj = obj.flow != null ? obj.flow : obj;

  // NOTE: sanity check
  if (obj.verdict == null && obj.nodeName == null) return null;

  const time = isoTimeToHubbleTime(obj.time) ?? void 0;
  const verdict = verdictHelpers.parse(obj.verdict);
  if (verdict == null) return null;

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
  const destinationService = flowServiceFromObj(obj.destinationService) ?? void 0;
  const trafficDirection = trafficDirectionFromStr(obj.trafficDirection);
  const authType = authTypeFromStr(obj.authType);

  return {
    time,
    verdict,
    dropReason: obj.dropReasonDesc || obj.dropReason,
    ethernet,
    ip,
    l4,
    source,
    destination,
    type,
    nodeName: obj.nodeName,
    sourceNamesList: obj.sourceNamesList ?? obj.sourceNames ?? [],
    destinationNamesList: obj.destinationNamesList ?? obj.destinationNames ?? [],
    l7,
    reply: obj.reply != null ? !!obj.reply : void 0,
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

export const hubbleFlowFromPb = (flow: flowpb.Flow): HubbleFlow => {
  let time: any = void 0;

  if (flow.time != null) {
    const timeObj = flow.time;

    time = {
      seconds: timeObj.seconds,
      nanos: timeObj.nanos,
    };
  }

  const verdict = verdictHelpers.verdictFromPb(flow.verdict);
  const ethernet = ethernetFromPb(flow.ethernet);
  const ip = ipFromPb(flow.iP);
  const l4 = l4FromPb(flow.l4);
  const source = endpointFromPb(flow.source);
  const destination = endpointFromPb(flow.destination);
  const type = flowTypeFromPb(flow.type);
  const l7 = l7FromPb(flow.l7);
  const eventType = ciliumEventTypeFromPb(flow.eventType);
  const sourceService = flowServiceFromPb(flow.sourceService);
  const destinationService = flowServiceFromPb(flow.destinationService);
  const trafficDirection = trafficDirectionFromPb(flow.trafficDirection);
  const authType = authTypeFromPb(flow.authType);

  return {
    time,
    verdict,
    dropReason: flow.dropReasonDesc || flow.dropReason,
    ethernet,
    ip,
    l4,
    source,
    destination,
    type,
    nodeName: flow.nodeName,
    sourceNamesList: flow.sourceNames,
    destinationNamesList: flow.destinationNames,
    l7,
    reply: flow.isReply?.value,
    eventType,
    sourceService,
    destinationService,
    summary: flow.summary,
    trafficDirection,
    authType,
  };
};

export const flowServiceFromPb = (svc: flowpb.Service | undefined): FlowService | undefined => {
  return svc == null ? undefined : svc;
};

export const flowServiceFromObj = (obj: any): FlowService | null => {
  if (obj == null) return null;

  return {
    name: obj.name,
    namespace: obj.namespace,
  };
};

export const ciliumEventTypeFromPb = (
  cet: flowpb.CiliumEventType | undefined,
): CiliumEventType | undefined => {
  return cet == null ? undefined : cet;
};

export const l7FromPb = (l7: flowpb.Layer7 | undefined): Layer7 | undefined => {
  if (l7 == null) return undefined;

  const obj = {
    type: l7FlowTypeFromPb(l7.type),
    latencyNs: l7.latencyNs,
    dns: l7.record.oneofKind === 'dns' ? l7.record.dns : void 0,
    http: l7.record.oneofKind === 'http' ? l7httpFromObj(l7.record.http) || void 0 : void 0,
    kafka: l7.record.oneofKind === 'kafka' ? l7.record.kafka : void 0,
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
    ips: dns.ips ?? dns.ipsList,
    ttl: dns.ttl ? parseInt(dns.ttl, 10) : 0,
    cnames: dns.cnames ?? dns.cnamesList,
    observationSource: dns.observationSource,
    qtypes: dns.qtypes ?? dns.qtypesList,
    rrtypes: dns.rrtypes ?? dns.rrtypesList,
    rcode: dns.rcode ?? -1,
  };
};

export const l7FlowTypeFromPb = (pb: flowpb.L7FlowType): L7FlowType => {
  let ft = L7FlowType.Unknown;

  if (pb === flowpb.L7FlowType.REQUEST) {
    ft = L7FlowType.Request;
  } else if (pb === flowpb.L7FlowType.RESPONSE) {
    ft = L7FlowType.Response;
  } else if (pb === flowpb.L7FlowType.SAMPLE) {
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

export const trafficDirectionFromPb = (pb: flowpb.TrafficDirection): TrafficDirection => {
  let dir = TrafficDirection.Unknown;

  if (pb === flowpb.TrafficDirection.INGRESS) {
    dir = TrafficDirection.Ingress;
  } else if (pb === flowpb.TrafficDirection.EGRESS) {
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

export const flowTypeFromPb = (ft: flowpb.FlowType): FlowType => {
  let t = FlowType.Unknown;

  if (ft === flowpb.FlowType.L3_L4) {
    t = FlowType.L34;
  } else if (ft === flowpb.FlowType.L7) {
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

export const endpointFromPb = (ep: flowpb.Endpoint | undefined): Endpoint | undefined => {
  if (ep == null) return void 0;

  return { ...ep, id: ep.iD };
};

export const endpointFromObj = (obj: any): Endpoint | null => {
  if (obj == null) return null;

  return {
    id: obj.id,
    identity: obj.identity,
    namespace: obj.namespace,
    labels: (obj.labels || obj.labelsList || []).slice(),
    workloads: [],
    podName: obj.podName,
  };
};

export const ethernetFromPb = (e: flowpb.Ethernet | undefined): Ethernet | undefined => {
  return e ?? void 0;
};

export const ipFromPb = (ip: flowpb.IP | undefined): IP | undefined => {
  if (ip == null) return undefined;

  let ipVersion = IPVersion.NotUsed;
  const fipVersion = ip.ipVersion;

  if (fipVersion === flowpb.IPVersion.IPv4) {
    ipVersion = IPVersion.V4;
  } else if (fipVersion == flowpb.IPVersion.IPv6) {
    ipVersion = IPVersion.V6;
  }

  return { ...ip, ipVersion };
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

export const l4FromPb = (l4: flowpb.Layer4 | undefined): Layer4 | undefined => {
  if (l4 == null) return undefined;

  let tcp: TCP | undefined = undefined;
  let udp: UDP | undefined = undefined;
  let icmpv4: ICMPv4 | undefined = undefined;
  let icmpv6: ICMPv6 | undefined = undefined;

  if (l4.protocol.oneofKind === 'tCP') {
    tcp = tcpFromPb(l4.protocol.tCP);
  }

  if (l4.protocol.oneofKind === 'uDP') {
    udp = udpFromPb(l4.protocol.uDP);
  }

  if (l4.protocol.oneofKind === 'iCMPv4') {
    icmpv4 = icmpv4FromPb(l4.protocol.iCMPv4);
  }

  if (l4.protocol.oneofKind === 'iCMPv6') {
    icmpv6 = icmpv6FromPb(l4.protocol.iCMPv6);
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

export const tcpFlagsFromObject = (obj: any | flowpb.TCPFlags): TCPFlags | null => {
  if (obj == null) return null;

  if (obj.toObject != null) obj = obj.toObject();

  return {
    fin: !!obj.fin || !!obj['FIN'] || !!obj.fIN,
    syn: !!obj.syn || !!obj['SYN'] || !!obj.sYN,
    rst: !!obj.rst || !!obj['RST'] || !!obj.rST,
    psh: !!obj.psh || !!obj['PSH'] || !!obj.pSH,
    ack: !!obj.ack || !!obj['ACK'] || !!obj.aCK,
    urg: !!obj.urg || !!obj['URG'] || !!obj.uRG,
    ece: !!obj.ece || !!obj['ECE'] || !!obj.eCE,
    cwr: !!obj.cwr || !!obj['CWR'] || !!obj.cWR,
    ns: !!obj.ns || !!obj['NS'] || !!obj.nS,
  };
};

export const tcpFromPb = (tcp: flowpb.TCP): TCP => {
  return {
    sourcePort: tcp.sourcePort,
    destinationPort: tcp.destinationPort,
    flags: tcp.flags ? tcpFlagsFromPb(tcp.flags) : void 0,
  };
};

export const tcpFlagsFromPb = (flags: flowpb.TCPFlags): TCPFlags => {
  return tcpFlagsFromObject(flags)!;
};

export const udpFromPb = (udp: flowpb.UDP): UDP => {
  return udp;
};

export const icmpv4FromPb = (icmp: flowpb.ICMPv4): ICMPv4 => {
  return icmp;
};

export const icmpv6FromPb = (icmp: flowpb.ICMPv6): ICMPv6 => {
  return icmpv4FromPb(icmp);
};
