import _ from 'lodash';

import { EventEmitter, HandlerTypes } from '~/utils/emitter';
import { Retries } from '~/utils/retry';
import { Timer } from '~/utils/timer';
import type { Union } from '~/utils/types';
import { DisposeFn } from '~/utils/disposer';

import { HTTPClient, HTTPResult, RepeatableRequest } from '~/api/http-client';
import { Message } from '~/api/customprotocol-core/message';
import { CustomError } from '~/api/customprotocol-core/errors';

export type Options = {
  route: string;
  httpClient: HTTPClient;
  retries?: Retries;
  reconnects?: boolean;
  timeout?: number;
  useJSON?: boolean;
};

export enum Event {
  Message = 'message',
  Terminated = 'terminated',
  Errors = 'errors',
  Stopped = 'stopped',
  ConnectionError = 'connection-error',
  ConnectTimeout = 'connect-timeout',
  UnknownError = 'unknown-error',
  EmptyResponse = 'empty-response',
  InvalidMessage = 'invalid-message',
  ReconnectAttempt = 'connect-attempt',
  Reconnected = 'reconnected',
  ConnectAttemptFailed = 'connect-attempt-failed',
}

export type Handlers = {
  [Event.Message]: (d: Message) => void;
  [Event.Terminated]: (isStopped: boolean, errors: CustomError[]) => void;
  [Event.Errors]: (e: CustomError[]) => void;
  [Event.Stopped]: () => void;
  [Event.ConnectionError]: (err: any) => void;
  [Event.ConnectTimeout]: (err: DOMException) => void;
  [Event.UnknownError]: (err: any) => void;
  [Event.EmptyResponse]: () => void;
  [Event.InvalidMessage]: (m: Message) => void;

  [Event.ConnectAttemptFailed]: (attmept: number, err: any) => void;
  [Event.ReconnectAttempt]: (attempt: number, delay: number) => void;
  [Event.Reconnected]: (attempt: number) => void;
};

export enum PollControl {
  Continue = 'continue',
  Finalized = 'finalized',
  Terminate = 'terminate',
}

export class Stream<H extends HandlerTypes = {}> extends EventEmitter<Union<Handlers, H>> {
  private retries: Retries;
  protected timer?: Timer;

  protected channelIdPromise?: Promise<string>;
  private resolveChannelPromise?: (chId: string) => void;

  private interruptPromise?: Promise<Symbol>;
  private resolveInterruptPromise?: () => void;

  protected pendingRequests: Set<RepeatableRequest> = new Set();

  public static generateTraceId(): string {
    return Math.random().toString(36).slice(2);
  }

  constructor(private opts: Options) {
    super(true);

    this.retries = opts.retries?.clone() ?? Retries.newExponential();
    this._setupEventHandlers();
  }

  private static readonly interrupted = Symbol('interrupted');

  public get isStopped() {
    return this.timer == null;
  }

  public async stop() {
    if (this.timer == null) return;

    await this.sendTerminateRequest().finally(() => {
      this.terminate();
    });
  }

  public terminate(): this {
    this.timer?.stop();
    this.timer = void 0;

    this.resolveInterruptPromise?.();
    this.resolveInterruptPromise = void 0;
    this.interruptPromise = void 0;

    this.resolveChannelPromise = void 0;
    this.channelIdPromise = void 0;

    this.pendingRequests.forEach(req => req.abort());

    return this;
  }

  public run(): this {
    if (this.timer == null) {
      this.timer = Timer.new(0);
    } else {
      return this;
    }

    this.timer
      .onTimeout(async () => {
        const isFirst = this.channelIdPromise == null;
        const [pollControl, resp] = await this.send(
          msg => {
            // NOTE: IsNotReady set to true means that this is simple Poll request
            if (!isFirst) msg.setIsNotReady(true);

            return this.messageBuilder(msg, isFirst);
          },
          req => {
            this.pendingRequests.add(req);

            return () => {
              this.pendingRequests.delete(req);
            };
          },
        );

        switch (pollControl) {
          case PollControl.Continue: {
            this.timer?.reset(resp?.pollDelay || 0);
            break;
          }
          case PollControl.Terminate: {
            await this.stop();
            break;
          }
          case PollControl.Finalized: {
            this.terminate();
            return;
          }
        }
      })
      .start();

    return this;
  }

  public async send(
    fn: (msg: Message) => Message,
    reqFn?: (req: RepeatableRequest) => DisposeFn,
  ): Promise<[PollControl, Message | null]> {
    try {
      const [req, resp] = await this._send(fn, reqFn);

      if (resp == null) {
        console.error('empty response, what?');
        return [PollControl.Continue, null];
      }

      // NOTE: This means that this stream is manually stopped.
      if (_.isSymbol(resp) || resp instanceof Symbol) {
        if (resp === Stream.interrupted) {
          this.emitter.emit(Event.Terminated, true, []);
          return [PollControl.Finalized, null];
        }

        console.error(`unrecognizable symbol returned: `, resp);
        return [PollControl.Terminate, null];
      }

      if (resp.isError) {
        this.emitter.emit(Event.Errors, resp.errors);
      }

      if (resp.hasPayload) {
        this.emitter.emit(Event.Message, resp);
      }

      // NOTE: We can have two cases: 1) When handler is terminated, but message queue
      // is still not empty 2) When handler is terminated and message queue is empty
      if (resp.isTerminated) {
        const control =
          resp.isNotReady || resp.isEmpty || req.isTerminated
            ? PollControl.Finalized
            : PollControl.Continue;

        // NOTE: We only emit Terminated event when its useless to continue polling
        if (control === PollControl.Finalized) {
          this.emitter.emit(Event.Terminated, req.isTerminated, resp.errors);
        }

        return [control, resp];
      }

      if (resp.pollDelay < Number.EPSILON) {
        this.emitter.emit(Event.InvalidMessage, resp);
        return [PollControl.Continue, resp];
      }

      return [PollControl.Continue, resp];
    } catch (err: any) {
      if (err instanceof DOMException) {
        if (err.name === 'AbortError') {
          return [PollControl.Finalized, null];
        }

        console.error('DOMException: ', err);
        this.emitter.emit(Event.ConnectTimeout, err);
      } else if (err instanceof TypeError) {
        console.error('TypeError: ', err);
        this.emitter.emit(Event.ConnectionError, err);
      } else {
        console.error('Unknown error: ', err);
        this.emitter.emit(Event.UnknownError, err);
        this.terminate();
      }

      return [PollControl.Continue, null];
    }
  }

  protected async _send(
    fn: (msg: Message) => Message,
    reqFn?: (req: RepeatableRequest) => DisposeFn,
  ): Promise<[Message, Message | Symbol | null]> {
    const isCreated = await this.ensureChannelPromise();
    const channelId = isCreated ? null : await this.channelIdPromise;
    const interruptPromise = this.ensureInterruptPromise();

    const traceId = Stream.generateTraceId();
    const stub = Message.newMessage(this.opts.route)
      .setTraceId(traceId)
      .setChannelId(channelId || void 0);

    const msg = fn(stub);

    const route = `/${this.opts.route}`;
    const payload = !!this.opts.useJSON ? msg.asLowerSnakeCaseJSON() : msg.asBytes();
    const req = this.opts.httpClient.post(route, payload, {
      timeout: this.opts?.timeout,
      keepAlive: true,
    });

    // NOTE: This disposer will remove request from pending requests set
    const disposer = reqFn?.(req);

    try {
      const resp = await Promise.any([
        interruptPromise,
        this.retries.try(async (_attempt, stop) => {
          // NOTE: This is only possible if `stream.stop()` was called
          if (this.timer == null) {
            stop();
            return Stream.interrupted;
          }

          // NOTE: `stop()` will terminate further attempts and throw possible
          // error further from this retry cycle.
          if (!this.opts.reconnects) stop();

          return await req
            .run()
            .then(resp => resp.arrayBuffer())
            .catch(err => {
              // NOTE: If error is recoverable we re-throw it to let `Retries`
              // do another attempt. If not, call `stop()` will prevent
              // any further retries and the error will be thrown out of this
              // retry cycle as non-recoverable and thus destructing entire
              // stream.
              if (!this.isErrorRecoverable(err)) stop();

              throw err;
            });
        }),
      ]);

      disposer?.();

      if (resp === Stream.interrupted) {
        return [msg, resp];
      } else if (resp == null) {
        return [msg, null];
      } else if (resp instanceof HTTPResult) {
        const respMsg = Message.newFromHTTPResult(resp, !!this.opts.useJSON);

        if (isCreated) this.resolveChannelPromise?.(respMsg.channelId);
        return [msg, respMsg];
      } else {
        return [msg, null];
      }
    } catch (err: any) {
      disposer?.();
      throw err;
    }
  }

  public onTerminated(fn: Handlers[Event.Terminated]): this {
    this.on(Event.Terminated, fn);
    return this;
  }

  public onStopped(fn: Handlers[Event.Stopped]): this {
    this.on(Event.Stopped, fn);
    return this;
  }

  public onErrors(fn: Handlers[Event.Errors]): this {
    this.on(Event.Errors, fn);
    return this;
  }

  public onMessage(fn: Handlers[Event.Message]): this {
    this.on(Event.Message, fn);
    return this;
  }

  public onInvalidMessage(fn: Handlers[Event.InvalidMessage]): this {
    this.on(Event.InvalidMessage, fn);
    return this;
  }

  public onConnectionError(fn: Handlers[Event.ConnectionError]): this {
    this.on(Event.ConnectionError, fn);
    return this;
  }

  // NOTE: This event is fired right before reconnect delay
  public onReconnectAttempt(fn: Handlers[Event.ReconnectAttempt]): this {
    this.on(Event.ReconnectAttempt, fn);
    return this;
  }

  public onReconnected(fn: Handlers[Event.Reconnected]): this {
    this.on(Event.Reconnected, fn);
    return this;
  }

  public onReconnectAttemptFailed(fn: Handlers[Event.ConnectAttemptFailed]): this {
    this.on(Event.ConnectAttemptFailed, fn);
    return this;
  }

  public onConnectTimeout(fn: Handlers[Event.ConnectTimeout]): this {
    this.on(Event.ConnectTimeout, fn);
    return this;
  }

  public onUnknownError(fn: Handlers[Event.UnknownError]): this {
    this.on(Event.UnknownError, fn);
    return this;
  }

  protected isErrorRecoverable(err: any): boolean {
    // NOTE: TypeError means we got smth wrong with request itself or when
    // connection error occurs. I suppose headers are good here...
    if (err instanceof TypeError) {
      return true;
    }

    if (err instanceof HTTPResult) {
      if (err.status == null) return true;

      if (err.status >= 400) {
        return false;
      }

      return true;
    }

    // NOTE: AbortError indicates timeout error
    if (err instanceof DOMException && err.name === 'AbortError') {
      return true;
    }

    return false;
  }

  protected messageBuilder(msg: Message, _isFirst: boolean): Message {
    return msg;
  }

  // NOTE: Use underscore `_` here to let derived classes use this name freely
  private _setupEventHandlers() {
    this.retries.onAttemptFailed((attempt, _isLast, _isStopped, err) => {
      this.emitter.emit(Event.ConnectAttemptFailed, attempt, err);
    });

    this.retries.onAttemptDelay((attempt, delay) => {
      this.emitter.emit(Event.ReconnectAttempt, attempt, delay);
    });

    this.retries.onAttemptSuccess(attempt => {
      if (attempt === 1) return;
      this.emitter.emit(Event.Reconnected, attempt);
    });
  }

  private async ensureChannelPromise(): Promise<boolean> {
    if (this.channelIdPromise != null && this.resolveChannelPromise != null) {
      return false;
    }

    this.channelIdPromise = new Promise<string>(resolve => {
      this.resolveChannelPromise = resolve;
    });

    return true;
  }

  private ensureInterruptPromise(): Promise<Symbol> {
    if (this.interruptPromise != null) return this.interruptPromise;

    this.interruptPromise = new Promise<Symbol>(resolve => {
      this.resolveInterruptPromise = () => resolve(Stream.interrupted);
    });

    return this.interruptPromise;
  }

  protected async sendTerminateRequest() {
    await this.send(msg => msg.setIsTerminated(true));
  }

  private get emitter(): EventEmitter<Handlers> {
    // TODO: Stop using this type narrowing hack when TypeScript is fixed
    return this as any;
  }
}
