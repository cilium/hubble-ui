import * as obpb from '~backend/proto/observer/observer_pb';
import * as relaypb from '~backend/proto/relay/relay_pb';

import { unifiedFormatDate } from './helpers/time';

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
  readonly reply?: boolean;
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
  workloads: Workload[];
  identity: number;
}

export interface HubbleLink {
  id: string;
  sourceId: string;
  destinationId: string;
  destinationPort: number;
  ipProtocol: IPProtocol;
  verdict: Verdict;
  flowAmount: number;
  latency: Latency;
  bytesTransfered: number;
  authType: AuthType;
  isEncrypted: boolean;
}

export type Latency = {
  min: Time;
  max: Time;
  avg: Time;
};

export type LinkThroughput = {
  flowAmount: number;
  latency: Latency;
  bytesTransfered: number;
};

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
  labels: string[];
  workloads: Workload[];
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
  ips: string[];
  ttl: number;
  cnames: string[];
  observationSource: string;
  rcode: number;
  qtypes: string[];
  rrtypes: string[];
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
  Redirected = 5,
  Traced = 6,
  Translated = 7,
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

export interface Workload {
  kind: string;
  name: string;
}

export enum AuthType {
  Disbaled = 0,
  Spire = 1,
  TestAlwaysFail = 2,
}

export class HubbleServerStatus {
  numFlows: number;
  maxFlows: number;
  seenFlows: number;
  uptimeNs: number;
  numConnectedNodes: number | null;
  numUnavailableNodes: number | null;
  unavailableNodesList: string[];
  version: string;

  public static fromPb(pbServerStatus: obpb.ServerStatusResponse) {
    return new HubbleServerStatus(pbServerStatus);
  }

  private constructor(pbServerStatus: obpb.ServerStatusResponse) {
    this.numFlows = pbServerStatus.numFlows;
    this.maxFlows = pbServerStatus.maxFlows;
    this.seenFlows = pbServerStatus.seenFlows;
    this.uptimeNs = pbServerStatus.uptimeNs;
    this.numConnectedNodes = pbServerStatus.numConnectedNodes?.value ?? null;
    this.numUnavailableNodes = pbServerStatus.numUnavailableNodes?.value ?? null;
    this.unavailableNodesList = pbServerStatus.unavailableNodes;
    this.version = pbServerStatus.version;
  }

  public get isFulfilled() {
    return !!this.numConnectedNodes && !Number.isNaN(this.flowsPerSecond);
  }

  public get totalNodes() {
    if (this.numConnectedNodes === null) return null;
    if (this.numUnavailableNodes === null) return null;
    return this.numConnectedNodes + this.numUnavailableNodes;
  }

  public get hasUnavailableNodes() {
    if (this.numConnectedNodes === null) return null;
    if (this.totalNodes === null) return null;
    return this.numConnectedNodes < this.totalNodes;
  }

  public get flowsPerSecond() {
    return calcFlowsPerSecond(this.uptimeNs, this.seenFlows);
  }
}

export enum HubbleNodeStateMap {
  UnknownNodeState = 0,
  NodeConnected = 1,
  NodeUnavailable = 2,
  NodeGone = 3,
  NodeError = 4,
}

type PBHubbleNode = obpb.GetNodesResponse['nodes'][0];

export class HubbleNode {
  name: string;
  version: string;
  address: string;
  state: HubbleNodeStateMap;
  tls: boolean;
  uptimeNs: number;
  numFlows: number;
  maxFlows: number;
  seenFlows: number;

  static calcFlowsPerSecond(arg: { uptimeNs: number; seenFlows: number }) {
    return calcFlowsPerSecond(arg.uptimeNs, arg.seenFlows);
  }

  static fromPb(pbHubbleNode: PBHubbleNode) {
    return new HubbleNode(pbHubbleNode);
  }

  private constructor(pbHubbleNode: PBHubbleNode) {
    this.name = pbHubbleNode.name;
    this.version = pbHubbleNode.version;
    this.address = pbHubbleNode.address;
    this.state = this.pbNodeStateToState(pbHubbleNode.state);
    this.tls = !!pbHubbleNode.tls?.enabled;
    this.uptimeNs = pbHubbleNode.uptimeNs;
    this.numFlows = pbHubbleNode.numFlows;
    this.maxFlows = pbHubbleNode.maxFlows;
    this.seenFlows = pbHubbleNode.seenFlows;
  }

  private memoHash: string | undefined;
  public get hash(): string {
    if (this.memoHash !== undefined) return this.memoHash;

    this.memoHash = [
      this.name,
      this.state,
      this.maxFlows,
      this.version,
      this.address,
      this.tls,
    ].join('+');

    return this.memoHash;
  }

  private memoHumanState: string | undefined;
  public get humanState(): string {
    if (this.memoHumanState !== undefined) return this.memoHumanState;

    switch (this.state) {
      case HubbleNodeStateMap.UnknownNodeState:
        this.memoHumanState = 'Unknown';
        break;
      case HubbleNodeStateMap.NodeConnected:
        this.memoHumanState = 'Connected';
        break;
      case HubbleNodeStateMap.NodeUnavailable:
        this.memoHumanState = 'Unavailable';
        break;
      case HubbleNodeStateMap.NodeGone:
        this.memoHumanState = 'Gone';
        break;
      case HubbleNodeStateMap.NodeError:
        this.memoHumanState = 'Error';
        break;
    }

    return this.memoHumanState;
  }

  private memoIsAvailable: boolean | undefined;
  public get isAvailable(): boolean {
    if (this.memoIsAvailable !== undefined) return this.memoIsAvailable;

    this.memoIsAvailable = this.state === HubbleNodeStateMap.NodeConnected;

    return this.memoIsAvailable;
  }

  private memoStartTime: Date | undefined;
  public get startTime(): Date {
    if (this.memoStartTime !== undefined) return this.memoStartTime;

    this.memoStartTime = new Date(Date.now() - this.uptimeNs / 1000000);

    return this.memoStartTime;
  }

  private memoHumanStartTime: string | undefined;
  public get humanStartTime(): string {
    if (this.memoHumanStartTime !== undefined) return this.memoHumanStartTime;

    this.memoHumanStartTime = unifiedFormatDate(this.startTime).human;

    return this.memoHumanStartTime;
  }

  private memoFlowsPerSecond: number | undefined;
  public get flowsPerSecond(): number {
    if (this.memoFlowsPerSecond !== undefined) return this.memoFlowsPerSecond;

    this.memoFlowsPerSecond = HubbleNode.calcFlowsPerSecond(this);

    return this.memoFlowsPerSecond;
  }

  private pbNodeStateToState(pbNodeState: relaypb.NodeState): HubbleNodeStateMap {
    switch (pbNodeState) {
      case relaypb.NodeState.UNKNOWN_NODE_STATE:
        return HubbleNodeStateMap.UnknownNodeState;
      case relaypb.NodeState.NODE_CONNECTED:
        return HubbleNodeStateMap.NodeConnected;
      case relaypb.NodeState.NODE_UNAVAILABLE:
        return HubbleNodeStateMap.NodeUnavailable;
      case relaypb.NodeState.NODE_GONE:
        return HubbleNodeStateMap.NodeGone;
      case relaypb.NodeState.NODE_ERROR:
        return HubbleNodeStateMap.NodeError;
    }
  }
}

export function calcFlowsPerSecond(uptimeNs: number, seenFlows: number): number {
  const uptimeSecs = uptimeNs / 1000000 / 1000;
  return seenFlows / uptimeSecs;
}
