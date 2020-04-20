import { Verdict } from './flows';
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
  creationTimestamp: number; // consider using BigInt here
}

export interface Link {
  id: string;
  sourceId: string;
  destinationId: string;
  destinationPort: number;
  ipProtocol: IPProtocol;
  verdict: Verdict;
}

export enum IPProtocol {
  Unknown,
  TCP,
  UDP,
  ICMPv4,
  ICMPv6,
}

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
