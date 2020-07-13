import { HubbleFlow } from '~/domain/flows';
import {
  IEventStream,
  EventParams,
  DataFilters,
  EventStreamHandlers,
  EventKind as EventStreamEventKind,
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
} from './event-stream';

export interface CoreAPIv1 {
  getEventStream: (
    params?: EventParams,
    filters?: DataFilters, // TODO: builder pattern ?
  ) => IEventStream;
}

export interface API {
  v1: CoreAPIv1;
}

export {
  IEventStream,
  EventParams,
  DataFilters,
  EventStreamHandlers,
  EventStreamEventKind,
  NamespaceChange,
  ServiceChange,
  ServiceLinkChange,
};
