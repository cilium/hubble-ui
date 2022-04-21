import _ from 'lodash';
import {
  ClientReadableStream,
  Error as GrpcError,
  Status as GrpcStatus,
  Metadata as GrpcMetadata,
} from 'grpc-web';

import { EventEmitter, HandlerTypes } from '~/utils/emitter';
import { TimerId } from '~/utils/common';
import { Retries, DelayInfo } from '~/utils/retry';
import { GrpcWrappedError } from './error';

export enum GRPCStreamEvent {
  // NOTE: original grpc stream events
  Data = 'data',
  Status = 'status',
  Metadata = 'metadata',
  Error = 'error',
  End = 'end',
  // NOTE: additional GRPCStream<T> events
  DataBatch = 'data-batch',
  ReconnectingStarted = 'reconnecting-started',
  ReconnectingDelay = 'reconnecting-delay',
  ReconnectingFailed = 'reconnecting-failed',
  ReconnectingSuccess = 'reconnecting-success',
  ReconnectingFinished = 'reconnecting-finished',
}

export type ReconnectingHandlers = {
  [GRPCStreamEvent.ReconnectingStarted]: () => void;
  [GRPCStreamEvent.ReconnectingDelay]: (di: DelayInfo) => void;
  [GRPCStreamEvent.ReconnectingFailed]: (err: GrpcWrappedError) => void;
  [GRPCStreamEvent.ReconnectingSuccess]: () => void;
  [GRPCStreamEvent.ReconnectingFinished]: () => void;
};

export type GRPCStreamHandlers<T> = ReconnectingHandlers & {
  [GRPCStreamEvent.Data]: (d: T) => void;
  [GRPCStreamEvent.DataBatch]: (d: T[]) => void;
  [GRPCStreamEvent.Status]: (st: GrpcStatus) => void;
  [GRPCStreamEvent.Metadata]: (md: GrpcMetadata) => void;
  [GRPCStreamEvent.Error]: (err: GrpcWrappedError) => void;
  [GRPCStreamEvent.End]: () => void;
};

type StreamSpawner<T> = () => ClientReadableStream<T>;
type DataEmitFn<T> = (d: T) => void;
type EventsOffFn = () => void;

export type Options<T> = {
  caching?: boolean;
  throttling?: number;
  streamFn?: StreamSpawner<T>;
  retries?: Retries;
  notReconnectOnStreamEnd?: boolean;
};

// NOTE: reconnecting starts if err.isUnavailable occured or End event is fired
// NOTE: starting reconnection procedure on End event can be configured in opts
export class GRPCStream<T, H extends HandlerTypes = {}> extends EventEmitter<
  GRPCStreamHandlers<T> & H
> {
  private underlyingStream: ClientReadableStream<T>;
  private opts: Options<T>;
  private emitData?: DataEmitFn<T>;
  private offUnderlyingEvents?: EventsOffFn;
  private batchBuffer: T[] = [];

  constructor(stream: ClientReadableStream<T>, opts?: Options<T>) {
    super(!!opts?.caching);

    this.underlyingStream = stream;
    this.opts = opts || {};

    this.withThrottling(this.opts.throttling ?? 0);
    this.withReconnecting(this.opts.streamFn, this.opts.retries);

    this.offUnderlyingEvents = this.setupUnderlyingEventHandlers();
  }

  public withThrottling(ms: number): this {
    this.opts.throttling = ms < Number.EPSILON ? void 0 : ms;
    this.emitData = this.createDataEmitter();
    return this;
  }

  public withCaching(c: boolean): this {
    this.opts.caching = c;
    super.setCaching(c);

    return this;
  }

  public withReconnecting(
    streamFn?: StreamSpawner<T>,
    retries?: Retries,
  ): this {
    this.opts.streamFn = streamFn;
    this.opts.retries =
      streamFn && retries ? retries : Retries.newExponential();

    return this;
  }

  // NOTE: this function implements best effort of trying to determine if stream
  // NOTE: can be considered connected; some explanation can be found here:
  // NOTE: https://github.com/grpc/grpc-web/issues/753
  public async connect(timeout = 3000) {
    return new Promise((resolve, reject) => {
      let resolveTimerId: TimerId | null = null;

      const offErrorHandler = this.emitter.once(GRPCStreamEvent.Error, err => {
        resolveTimerId && clearTimeout(resolveTimerId);
        offDataHandler();

        reject(err);
      });

      // NOTE: If we get any piece of stream data then connection is established
      const offDataHandler = this.emitter.once(GRPCStreamEvent.Data, evt => {
        resolveTimerId && clearTimeout(resolveTimerId);
        offErrorHandler();

        // NOTE: push current event back to event emitter in case it is cached
        this.emitter.emit(GRPCStreamEvent.Data, evt);
        resolve(null);
      });

      resolveTimerId = setTimeout(() => {
        offErrorHandler();
        offDataHandler();
        resolve(null);
      }, timeout);
    });
  }

  public stop(final?: boolean) {
    this.underlyingStream.cancel();
    this.offUnderlyingEvents?.();
    !!final && this.offAllEvents();
  }

  // NOTE: this method is private to force all descendant to explicitly implement
  // NOTE: additional reconnect logic: since reconnect calls stop() internally
  // NOTE: all event handlers is dropped, so you need to setup them again
  public async reconnect() {
    await this.handleReconnecting();
  }

  public onReconnectingStarted(
    cb: ReconnectingHandlers[GRPCStreamEvent.ReconnectingStarted],
  ) {
    this.emitter.on(GRPCStreamEvent.ReconnectingStarted, cb);
  }

  public onReconnectingDelay(
    cb: ReconnectingHandlers[GRPCStreamEvent.ReconnectingDelay],
  ) {
    this.emitter.on(GRPCStreamEvent.ReconnectingDelay, cb);
  }

  public onReconnectingFailed(
    cb: ReconnectingHandlers[GRPCStreamEvent.ReconnectingFailed],
  ) {
    this.emitter.on(GRPCStreamEvent.ReconnectingFailed, cb);
  }

  public onReconnectingSuccess(
    cb: ReconnectingHandlers[GRPCStreamEvent.ReconnectingSuccess],
  ) {
    this.emitter.on(GRPCStreamEvent.ReconnectingSuccess, cb);
  }

  public onReconnectingFinished(
    cb: ReconnectingHandlers[GRPCStreamEvent.ReconnectingFinished],
  ) {
    this.emitter.on(GRPCStreamEvent.ReconnectingFinished, cb);
  }

  public onError(cb: GRPCStreamHandlers<T>[GRPCStreamEvent.Error]) {
    this.emitter.on(GRPCStreamEvent.Error, cb);
  }

  public onEnd(cb: GRPCStreamHandlers<T>[GRPCStreamEvent.End]) {
    this.emitter.on(GRPCStreamEvent.End, cb);
  }

  public onStatus(cb: GRPCStreamHandlers<T>[GRPCStreamEvent.Status]) {
    this.emitter.on(GRPCStreamEvent.Status, cb);
  }

  public onMetadata(cb: GRPCStreamHandlers<T>[GRPCStreamEvent.Metadata]) {
    this.emitter.on(GRPCStreamEvent.Metadata, cb);
  }

  public onData(cb: GRPCStreamHandlers<T>[GRPCStreamEvent.Data]) {
    this.emitter.on(GRPCStreamEvent.Data, cb);
  }

  public onDataBatch(cb: GRPCStreamHandlers<T>[GRPCStreamEvent.DataBatch]) {
    this.emitter.on(GRPCStreamEvent.DataBatch, cb);
  }

  private setupUnderlyingEventHandlers(): EventsOffFn {
    // NOTE: if no .on() calls were performed, each emit will preserve the event
    const onData = (d: T) => {
      this.emitData?.(d);
    };

    const onStatus = (st: GrpcStatus) => {
      this.emitter.emit(GRPCStreamEvent.Status, st);
    };

    const onMetadata = (md: GrpcMetadata) => {
      this.emitter.emit(GRPCStreamEvent.Metadata, md);
    };

    const onError = (err: GrpcError) => {
      const wrapped = GrpcWrappedError.new(err);
      this.emitter.emit(GRPCStreamEvent.Error, wrapped);

      if (!wrapped.isConnectionError) return;
      this.handleReconnecting();
    };

    const onEnd = () => {
      this.emitter.emit(GRPCStreamEvent.End);

      if (!!this.opts.notReconnectOnStreamEnd) return;
      this.handleReconnecting();
    };

    this.underlyingStream.on(GRPCStreamEvent.Data, onData);
    this.underlyingStream.on(GRPCStreamEvent.Status, onStatus);
    this.underlyingStream.on(GRPCStreamEvent.Metadata, onMetadata);
    this.underlyingStream.on(GRPCStreamEvent.Error, onError);
    this.underlyingStream.on(GRPCStreamEvent.End, onEnd);

    return () => {
      this.underlyingStream.removeListener(GRPCStreamEvent.Data, onData);
      this.underlyingStream.removeListener(GRPCStreamEvent.Status, onStatus);
      this.underlyingStream.removeListener(
        GRPCStreamEvent.Metadata,
        onMetadata,
      );
      this.underlyingStream.removeListener(GRPCStreamEvent.Error, onError);
      this.underlyingStream.removeListener(GRPCStreamEvent.End, onEnd);
    };
  }

  private async handleReconnecting() {
    if (this.opts.streamFn == null) return;
    if (this.opts.retries == null) {
      this.opts.retries = Retries.newExponential();
    }

    this.stop();
    this.emitter.emit(GRPCStreamEvent.ReconnectingStarted);

    await this.opts.retries
      .clone()
      .onTick(di => this.emitter.emit(GRPCStreamEvent.ReconnectingDelay, di))
      .try(async () => {
        const underlyingStream = this.opts.streamFn?.();
        if (underlyingStream == null) return;

        const stream = new GRPCStream(underlyingStream, { caching: true });
        await stream.connect().catch((err: GrpcError) => {
          this.emitter.emit(
            GRPCStreamEvent.ReconnectingFailed,
            GrpcWrappedError.new(err),
          );

          throw err;
        });

        this.acquire(stream);
        this.emitter.emit(GRPCStreamEvent.ReconnectingSuccess);
      })
      .finally(() => this.emitter.emit(GRPCStreamEvent.ReconnectingFinished));
  }

  private acquire(stream: GRPCStream<T, H>) {
    this.underlyingStream = stream.unwrap();
    this.setupUnderlyingEventHandlers();

    stream.getCachedEvents().forEach((payloads, evt) => {
      payloads.forEach(payload => {
        this.emit(evt, ...(payload as any));
      });
    });
  }

  // NOTE: this method releases underlying stream freeing it from any listeners
  private unwrap(): ClientReadableStream<T> {
    this.offUnderlyingEvents?.();
    this.offAllEvents();

    return this.underlyingStream;
  }

  private createDataEmitter(): DataEmitFn<T> {
    // NOTE: sad that this check will be performed for each data event :/
    if (!this.opts.throttling) {
      return (d: T) => this.emitter.emit(GRPCStreamEvent.Data, d);
    }

    const throttledEmit = _.throttle(() => {
      this.emitter.emit(GRPCStreamEvent.DataBatch, this.batchBuffer);
      this.batchBuffer.splice(0, this.batchBuffer.length);
    }, this.opts.throttling);

    return (d: T) => {
      this.batchBuffer.push(d);
      throttledEmit();
    };
  }

  // NOTE: This cheat allows to fix strange behaviour of typescript when it
  // NOTE: cannot make a correct EventEmitter<A & B> just because the class
  // NOTE: that extends him also uses generic parameters ><.
  // NOTE: But note that this is safe conversion, since EventEmitter<A & B>
  // NOTE: is also EventEmitter<A> or EventEmitter<B>;
  private get emitter(): EventEmitter<GRPCStreamHandlers<T>> {
    return this as EventEmitter<GRPCStreamHandlers<T>>;
  }
}
