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
  readonly trafficDirection: TrafficDirection;
  readonly authType: AuthType;
}

export interface HubbleService {
  id: string;
  name: string;
  namespace: string;
  labels: Array<KV>;
  dnsNames: Array<string>;
  egressPolicyEnforced: boolean;
  ingressPolicyEnforced: boolean;
  visibilityPolicyStatus: string;
  creationTimestamp: Time;
}

export interface HubbleLink {
  id: string;
  sourceId: string;
  destinationId: string;
  destinationPort: number;
  ipProtocol: IPProtocol;
  verdict: Verdict;
  authType: AuthType;
  isEncrypted: boolean;
}

export enum IPProtocol {
  Unknown = 0,
  TCP = 1,
  UDP = 2,
  ICMPv4 = 3,
  ICMPv6 = 4,
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

export enum L7Kind {
  DNS = 'dns',
  HTTP = 'http',
  Kafka = 'kafka',
  Unknown = 'unknown',
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

export type TCPFlagName = keyof TCPFlags;

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

export interface PodSelector {
  pod: string;
  namespace?: string;
}

export enum Verdict {
  Unknown = 0,
  Forwarded = 1,
  Dropped = 2,
  Error = 3,
  Audit = 4,
}

export enum FlowType {
  Unknown,
  L34,
  L7,
}

export enum L7FlowType {
  Unknown = 0,
  Request = 1,
  Response = 2,
  Sample = 3,
}

export enum TrafficDirection {
  Unknown = 0,
  Ingress = 1,
  Egress = 2,
}

export enum AuthType {
  Disbaled = 0,
  Spire = 1,
  TestAlwaysFail = 2,
}
