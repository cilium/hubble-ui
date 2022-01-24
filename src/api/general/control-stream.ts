import { GrpcWrappedError } from '~/api/grpc/error';
import { Notification } from '~/domain/notifications';
import { NamespaceChange } from '~/domain/events';

import { Parameter } from '~/utils/types';
import { RegularStream, DisposableStream } from './stream-utils';

// NOTE: a stream that receive main data required for the UI.
// NOTE: This stream does two things: fetches namespaces and all other control
// NOTE: data; need to think how to disjoin these tasks
export type ControlStream = RegularStream & {
  onNamespaceChange: (_: (_: NamespaceChange) => void) => void;
  onNotification: (_: (_: Notification) => void) => void;
  onError: (_: (_: GrpcWrappedError) => void) => void;
};

export type NotificationStream = Pick<ControlStream, 'onNotification'>;

export type Handlers = Omit<
  {
    [K in keyof ControlStream]: Parameter<ControlStream[K], 0>;
  },
  'reconnect' | keyof DisposableStream
>;
