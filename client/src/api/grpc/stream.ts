import { Message as ProtobufMessage } from 'google-protobuf';
import {
  ClientReadableStream as GrpcStream,
  Error as GrpcError,
  Status as GrpcStatus,
} from 'grpc-web';
import _ from 'lodash';
import { EventEmitter } from '~/utils/emitter';

export { GrpcStream };

export enum StreamEvent {
  DATA = 'response',
  ERROR = 'error',
  STATUS = 'status',
  END = 'end',
  BATCH_DRAIN = 'batch-drain',
}

export type TypedHandler<T> = {
  [StreamEvent.DATA]: (data: T) => void;
  [StreamEvent.BATCH_DRAIN]: (data: T[]) => void;
  [StreamEvent.ERROR]: (error: GrpcError) => void;
  [StreamEvent.END]: () => void;
  [StreamEvent.STATUS]: (status: GrpcStatus) => void;
};

export class DataStream<Message extends ProtobufMessage> extends EventEmitter<
  TypedHandler<Message>
> {
  private grpcStream: GrpcStream<Message>;

  private throttleDelayMs: number;
  private throttleBuffer: Array<Message> = [];
  private throttleEmitData?: () => void;
  private onDataHandler?: (m: Message) => void;

  public constructor(
    grpcStream: GrpcStream<Message>,
    throttleDelayMs?: number,
  ) {
    super();

    this.grpcStream = grpcStream;
    this.throttleDelayMs = throttleDelayMs ?? 0;

    this.setupThrottling();
    this.setupEventHandlers();
  }

  public stop() {
    this.grpcStream.cancel();
  }

  public get batched() {
    return this.throttleDelayMs !== 0;
  }

  public get dataEvent() {
    return this.batched ? StreamEvent.BATCH_DRAIN : StreamEvent.DATA;
  }

  private setupThrottling() {
    if (this.throttleDelayMs === 0) return;

    this.throttleEmitData = _.throttle(() => {
      this.emit(StreamEvent.BATCH_DRAIN, this.throttleBuffer);
      this.throttleBuffer = [];
    }, this.throttleDelayMs);
  }

  private setupEventHandlers() {
    this.onDataHandler = this.makeOnDataHandler();
    this.grpcStream.on('data', this.onDataHandler);

    this.grpcStream.on('error', error => {
      console.error(error);
      this.emit(StreamEvent.ERROR, error);
    });

    this.grpcStream.on('status', status => {
      console.log(status.metadata);
      this.emit(StreamEvent.STATUS, status);
    });

    this.grpcStream.on('end', () => {
      this.emit(StreamEvent.END);
    });
  }

  private makeOnDataHandler() {
    if (this.throttleDelayMs === 0) {
      return (data: Message) => {
        this.emit(StreamEvent.DATA, data);
      };
    }

    return (data: Message) => {
      if (!this.throttleEmitData) {
        throw new Error('throttle emit data should be initialized');
      }
      this.throttleBuffer.push(data);
      this.throttleEmitData();
    };
  }
}
