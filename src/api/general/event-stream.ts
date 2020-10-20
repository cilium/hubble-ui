import { EventEmitter } from '~/utils/emitter';
import { GeneralStreamEvents } from './stream';

import { Verdict, HubbleService, HubbleLink } from '~/domain/hubble';
import { Flow, FlowsFilterEntry } from '~/domain/flows';
import { StateChange } from '~/domain/misc';

export interface EventParams {
  flow?: boolean;
  flows?: boolean;
  namespaces?: boolean;
  services?: boolean;
  serviceLinks?: boolean;
}

export const EventParamsSet = {
  All: {
    flow: false,
    flows: true,
    namespaces: true,
    services: true,
    serviceLinks: true,
  },
  Namespaces: {
    flow: false,
    flows: false,
    namespaces: true,
    services: false,
    serviceLinks: false,
  },
};

export enum EventKind {
  Flow = 'flow',
  Flows = 'flows',
  Namespace = 'namespace',
  Service = 'service',
  ServiceLink = 'service-link',
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

export type EventStreamHandlers = GeneralStreamEvents & {
  [EventKind.Flow]: (_: Flow) => void;
  [EventKind.Flows]: (_: Flow[]) => void;
  [EventKind.Namespace]: (_: NamespaceChange) => void;
  [EventKind.Service]: (_: ServiceChange) => void;
  [EventKind.ServiceLink]: (_: ServiceLinkChange) => void;
};

export interface IEventStream extends EventEmitter<EventStreamHandlers> {
  flowsDelay: number;

  stop: (dropEventHandlers?: boolean) => Promise<void>;
}
