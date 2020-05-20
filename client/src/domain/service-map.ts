import { Verdict, Time } from './hubble';
import { KV } from './misc';

export interface Service {
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

export interface Link {
  id: string;
  sourceId: string;
  destinationId: string;
  destinationPort: number;
  ipProtocol: IPProtocol;
  verdict: Verdict;
}

export interface AccessPoint {
  id: string;
  port: number;
  protocol: IPProtocol;
  serviceId: string;
}

export type AccessPoints = Map<string, Map<number, AccessPoint>>;

export enum IPProtocol {
  Unknown,
  TCP,
  UDP,
  ICMPv4,
  ICMPv6,
}

export enum InteractionKind {
  Links = 'links',
  Flows = 'flows',
}

export type InteractionKindMap = {
  [InteractionKind.Links]?: Array<Link>;
  [InteractionKind.Flows]?: Array<any>; // should be Array<Flow>
};

export type Interactions<O = {}> = O & InteractionKindMap;

export enum ApplicationKind {
  HTTP = 'http',
  GRPC = 'grpc',
  ElasticSearch = 'elasticsearch',
  Kafka = 'kafka',
  RabbitMQ = 'rabbitmq',
  PostgreSQL = 'postgresql',
  MySQL = 'mysql',
  Redis = 'redis',
  Zookeeper = 'zookeeper',
}
