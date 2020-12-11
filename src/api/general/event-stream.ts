import { EventEmitter } from '~/utils/emitter';
import { GeneralStreamEvents } from './stream';

import { Verdict, HubbleService, HubbleLink } from '~/domain/hubble';
import { Flow } from '~/domain/flows';
import { StateChange } from '~/domain/misc';
import { Status } from '~/domain/status';

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
  Namespace = 'namespace',
  Service = 'service',
  ServiceLink = 'service-link',
  Notification = 'notification',
}

export interface NamespaceChange {
  name: string;
  change: StateChange;
}

export interface ServiceChange {
  service: HubbleService;
  change: StateChange;
}

export interface ServiceLinkChange {
  serviceLink: HubbleLink;
  change: StateChange;
}

export interface Notification {
  connState?: {
    connected: boolean;
    reconnecting: boolean;
  };

  dataState?: {
    noActivity: boolean;
  };

  status?: Status;
}

export type EventStreamHandlers = GeneralStreamEvents & {
  [EventKind.Flow]: (_: Flow) => void;
  [EventKind.Flows]: (_: Flow[]) => void;
  [EventKind.Namespace]: (_: NamespaceChange) => void;
  [EventKind.Service]: (_: ServiceChange) => void;
  [EventKind.ServiceLink]: (_: ServiceLinkChange) => void;
  [EventKind.Notification]: (_: Notification) => void;
};

export interface IEventStream extends EventEmitter<EventStreamHandlers> {
  flowsDelay: number;

  stop: (dropEventHandlers?: boolean) => Promise<void>;
}
