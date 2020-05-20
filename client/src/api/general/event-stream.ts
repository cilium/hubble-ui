import { EventEmitter } from '~/utils/emitter';
import { GeneralStreamEvents } from './stream';

import { Verdict } from '~/domain/hubble';
import { HubbleFlow, FlowsFilterEntry } from '~/domain/flows';
import { Service, Link } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';

export interface EventParams {
  flows?: boolean;
  namespaces?: boolean;
  services?: boolean;
  serviceLinks?: boolean;
}

export const EventParamsSet = {
  All: {
    flows: true,
    namespaces: true,
    services: true,
    serviceLinks: true,
  },
  Namespaces: {
    flows: false,
    namespaces: true,
    services: false,
    serviceLinks: false,
  },
};

export enum EventKind {
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
  service: Service;
  change: StateChange;
}

export interface ServiceLinkChange {
  serviceLink: Link;
  change: StateChange;
}

export interface DataFilters {
  namespace: string;
  verdict?: Verdict | null;
  httpStatus?: string | null;
  filters: FlowsFilterEntry[];
}

export type EventStreamHandlers = GeneralStreamEvents & {
  [EventKind.Flows]: (_: HubbleFlow[]) => void;
  [EventKind.Namespace]: (_: NamespaceChange) => void;
  [EventKind.Service]: (_: ServiceChange) => void;
  [EventKind.ServiceLink]: (_: ServiceLinkChange) => void;
};

export interface IEventStream extends EventEmitter<EventStreamHandlers> {
  flowsDelay: number;

  stop: () => Promise<void>;
}
