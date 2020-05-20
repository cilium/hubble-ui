import { KV } from './misc';

export interface HubbleFlow {
  readonly time?: Time;
  readonly verdict: Verdict;
  readonly dropReason: number;
  readonly ethernet?: Ethernet;
  readonly ip?: IP;
  readonly l4?: Layer4;
  readonly source?: Endpoint;
  readonly destination?: Endpoint;
  readonly type: FlowType;
  readonly nodeName: string;
  readonly sourceNamesList: Array<string>;
  readonly destinationNamesList: Array<string>;
  readonly l7?: Layer7;
  readonly reply: boolean;
  readonly eventType?: CiliumEventType;
  readonly sourceService?: Service;
  readonly destinationService?: Service;
  readonly summary: string;
}

export interface Time {
  seconds: number;
  nanos: number;
}

export interface Endpoint {
  id: number;
  identity: number;
  namespace: string;
  labelsList: Array<string>;
  podName: string;
}

export interface Layer4 {
  tcp?: TCP;
  udp?: UDP;
  icmpv4?: ICMPv4;
  icmpv6?: ICMPv6;
}

export interface Layer7 {
  type: L7FlowType;
  latencyNs: number;
  dns?: DNS;
  http?: HTTP;
  kafka?: Kafka;
}

export interface Kafka {
  errorCode: number;
  apiVersion: number;
  apiKey: string;
  correlationId: number;
  topic: string;
}

export interface HTTP {
  code: number;
  method: string;
  url: string;
  protocol: string;
  headersList: Array<HTTPHeader>;
}

export type HTTPHeader = KV;

export interface DNS {
  query: string;
  ipsList: Array<string>;
  ttl: number;
  cnamesList: Array<string>;
  observationSource: string;
  rcode: number;
  qtypesList: Array<string>;
  rrtypesList: Array<string>;
}

export interface ICMPv4 {
  type: number;
  code: number;
}

export type ICMPv6 = ICMPv4;

export interface UDP {
  sourcePort: number;
  destinationPort: number;
}

export interface TCP {
  sourcePort: number;
  destinationPort: number;
  flags?: TCPFlags;
}

export interface TCPFlags {
  fin: boolean;
  syn: boolean;
  rst: boolean;
  psh: boolean;
  ack: boolean;
  urg: boolean;
  ece: boolean;
  cwr: boolean;
  ns: boolean;
}

export interface IP {
  source: string;
  destination: string;
  ipVersion: IPVersion;
  encrypted: boolean;
}

export enum IPVersion {
  NotUsed,
  V4,
  V6,
}

export interface Ethernet {
  source: string;
  destination: string;
}

export interface CiliumEventType {
  type: number;
  subType: number;
}

export interface Service {
  name: string;
  namespace: string;
}

export enum Verdict {
  Unknown = 0,
  Forwarded = 1,
  Dropped = 2,
  Error = 3,
}

export enum FlowType {
  Unknown,
  L34,
  L7,
}

export enum L7FlowType {
  UNKNOWN_L7_TYPE,
  REQUEST,
  RESPONSE,
  SAMPLE,
}
