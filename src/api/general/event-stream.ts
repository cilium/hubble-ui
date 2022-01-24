import { Flow } from '~/domain/flows';
import { HubbleFlow } from '~/domain/hubble';
import { Notification } from '~/domain/notifications';
import { Filters } from '~/domain/filtering';
import {
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
} from '~/domain/events';

import { RegularStream } from './stream-utils';

export interface EventParams {
  flow?: boolean;
  flows?: boolean;
  namespaces?: boolean;
  services?: boolean;
  serviceLinks?: boolean;
  status?: boolean;
}

export const EventParamsSet = {
  All: {
    flow: false,
    flows: true,
    namespaces: true,
    services: true,
    serviceLinks: true,
    status: true,
  },
  AllButNamespaces: {
    flow: false,
    flows: true,
    namespaces: false,
    services: true,
    serviceLinks: true,
    status: true,
  },
  Namespaces: {
    flow: false,
    flows: false,
    namespaces: true,
    services: false,
    serviceLinks: false,
    status: true,
  },
};

export enum EventKind {
  Flow = 'flow',
  Flows = 'flows',
  RawFlow = 'raw-flow',
  Namespace = 'namespace',
  Service = 'service',
  ServiceLink = 'service-link',
  Notification = 'notification',
}

export type Handlers = {
  [EventKind.Flow]: (_: Flow) => void;
  [EventKind.Flows]: (_: Flow[]) => void;
  [EventKind.RawFlow]: (_: HubbleFlow) => void;
  [EventKind.Namespace]: (_: NamespaceChange) => void;
  [EventKind.Service]: (_: ServiceChange) => void;
  [EventKind.ServiceLink]: (_: ServiceLinkChange) => void;
  [EventKind.Notification]: (_: Notification) => void;
};

export type EventStream = RegularStream & {
  flowsDelay: number;
  filters?: Filters;

  onFlow: (_: Handlers[EventKind.Flow]) => void;
  onFlows: (_: Handlers[EventKind.Flows]) => void;
  onRawFlow: (_: Handlers[EventKind.RawFlow]) => void;
  onNamespaceChange: (_: Handlers[EventKind.Namespace]) => void;
  onServiceChange: (_: Handlers[EventKind.Service]) => void;
  onServiceLinkChange: (_: Handlers[EventKind.ServiceLink]) => void;
  onNotification: (_: Handlers[EventKind.Notification]) => void;
};

export type FlowsStream = Pick<EventStream, 'onFlows'>;
