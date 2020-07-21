import {
  HubbleService,
  HubbleFlow,
  IPProtocol,
  Verdict,
  HubbleLink,
} from './hubble';

import { Link } from './link';

export type Service = HubbleService;

export { Link };

export interface AccessPoint {
  id: string;
  port: number;
  protocol: IPProtocol;
  serviceId: string;
}

export type AccessPoints = Map<string, Map<number, AccessPoint>>;

export enum InteractionKind {
  Links = 'links',
  Flows = 'flows',
}

export type Interactions =
  | {
      kind: InteractionKind.Flows;
      flows: HubbleFlow[];
    }
  | {
      kind: InteractionKind.Links;
      links: HubbleLink[];
    };

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
  Prometheus = 'prometheus',
}
