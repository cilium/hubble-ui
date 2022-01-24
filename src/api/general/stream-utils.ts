import { DelayInfo } from '~/utils/retry';

// TODO: we need general Error class if we want to have different APIs: GRPC, etc
import { GrpcWrappedError } from '../grpc/error';

export type ReconnectableStream = {
  onReconnectingStarted: (cb: () => void) => void;
  onReconnectingDelay: (cb: (_: DelayInfo) => void) => void;
  onReconnectingFailed: (cb: (_: GrpcWrappedError) => void) => void;
  onReconnectingSuccess: (cb: () => void) => void;
  onReconnectingFinished: (cb: () => void) => void;

  reconnect: () => void;
};

export type DisposableStream = {
  stop: (_?: boolean) => void;
};

export type Stream = {
  onError: (cb: (_: GrpcWrappedError) => void) => void;
  onEnd: (cb: () => void) => void;
};

export type RegularStream = Stream & ReconnectableStream & DisposableStream;
