import { Filters } from '~/domain/filtering';
import { FeatureFlags } from '~/domain/features';

import { ControlStream } from './control-stream';
import {
  EventStream,
  EventKind as EventStreamEventKind,
  EventParams,
} from './event-stream';

export interface CoreAPIv1 {
  getControlStream: () => ControlStream;

  getEventStream: (
    params?: EventParams,
    filters?: Filters, // TODO: builder pattern ?
  ) => EventStream;

  getFeatureFlags: () => Promise<FeatureFlags>;
}

export interface API {
  v1: CoreAPIv1;
}

export { EventStream, EventParams, EventStreamEventKind };
