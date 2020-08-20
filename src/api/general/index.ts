import { HubbleFlow } from '~/domain/flows';
import { Filters } from '~/domain/filtering';
import {
  IEventStream,
  EventParams,
  EventStreamHandlers,
  EventKind as EventStreamEventKind,
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
} from './event-stream';

export interface CoreAPIv1 {
  getEventStream: (
    params?: EventParams,
    filters?: Filters, // TODO: builder pattern ?
  ) => IEventStream;
}

export interface API {
  v1: CoreAPIv1;
}

export {
  IEventStream,
  EventParams,
  EventStreamHandlers,
  EventStreamEventKind,
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
};
