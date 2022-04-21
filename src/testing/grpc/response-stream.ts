// import { ResponseStream, GrpcStatus } from '~/api/grpc';
import {
  ClientReadableStream,
  Status as GrpcStatus,
  Metadata as GrpcMetadata,
} from 'grpc-web';
import { EventEmitter } from '~/utils/emitter';

export type Handlers<T> = {
  data: (d: T) => void;
  status: (st: GrpcStatus) => void;
  end: (st?: GrpcStatus) => void;
  error: (err: Error) => void;
  metadata: (md: GrpcMetadata) => void;
};

export class DumbResponseStream<T>
  extends EventEmitter<Handlers<T>>
  implements ClientReadableStream<T>
{
  public static new<T>(): DumbResponseStream<T> {
    return new DumbResponseStream();
  }

  constructor() {
    super(false);
  }

  public cancel() {
    return;
  }

  public on<K extends keyof Handlers<T>>(evt: K, handler: Handlers<T>[K]): any {
    super.on(evt, handler);

    return () => super.off(evt, handler);
  }

  public removeListener<K extends keyof Handlers<T>>(
    evt: K,
    handler: Handlers<T>[K],
  ) {
    super.off(evt, handler);
  }
}
