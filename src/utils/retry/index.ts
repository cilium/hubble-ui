import { EventEmitter } from '~/utils/emitter';

import { RetriesFailed } from './error';
import { Delayer, RetryFn } from './common';
import { Delayer as ExponentialDelayer } from './exponential';

export enum Event {
  AttemptStarted = 'attempt-started',
  AttemptFailed = 'attempt-failed',
  AttemptDelay = 'attempt-delay',
  AttemptSuccess = 'attempt-success',
}

export type Handlers = {
  [Event.AttemptStarted]: (attempt: number) => void;
  [Event.AttemptFailed]: (attempt: number, isLast: boolean, stopped: boolean, err: any) => void;
  [Event.AttemptDelay]: (attempt: number, delay: number) => void;
  [Event.AttemptSuccess]: (attempt: number) => void;
};

export class Retries extends EventEmitter<Handlers> {
  private delayer: Delayer;
  private attempt = 1;

  public readonly maxAttempts: number;

  public static newExponential(
    maxAttempts = Infinity,
    factor = 1.6,
    maxDelay = 7000,
    minDelay = 1000,
  ) {
    const delayer = new ExponentialDelayer({ maxDelay, minDelay, factor });
    return new Retries(delayer, maxAttempts);
  }

  constructor(delayer: Delayer, maxAttempts = Infinity) {
    super(true);

    this.delayer = delayer;
    this.maxAttempts = maxAttempts;
  }

  public clone(): Retries {
    return new Retries(this.delayer.clone(), this.maxAttempts);
  }

  public async try<T>(fn: RetryFn<T>): Promise<T | null> {
    while (this.canDoAttempt) {
      let stop = false;
      this.emit(Event.AttemptStarted, this.attempt);

      try {
        let result = fn(this.attempt, () => {
          stop = true;
        });

        if (result instanceof Promise) {
          result = await result;
        }

        this.emit(Event.AttemptSuccess, this.attempt);
        return result;
      } catch (err) {
        this.emit(Event.AttemptFailed, this.attempt, this.isLastAttempt, stop, err);

        if (stop || this.isLastAttempt) throw err;

        this.emit(Event.AttemptDelay, this.attempt, this.delayer.nextDelay());
        await this.delayer.wait();
      }

      this.attempt += 1;
      if (stop) return null;
    }

    throw new RetriesFailed().setAttemptLimitReached(true);
  }

  public reset() {
    this.delayer.reset();
    this.attempt = 1;
  }

  public nextDelay() {
    return this.delayer.nextDelay();
  }

  public async wait() {
    await this.delayer.wait();
  }

  public onAttemptDelay(fn: Handlers[Event.AttemptDelay]): this {
    this.on(Event.AttemptDelay, fn);
    return this;
  }

  public onAttemptSuccess(fn: Handlers[Event.AttemptSuccess]): this {
    this.on(Event.AttemptSuccess, fn);
    return this;
  }

  public onAttemptFailed(fn: Handlers[Event.AttemptFailed]): this {
    this.on(Event.AttemptFailed, fn);
    return this;
  }

  public get canDoAttempt(): boolean {
    return !Number.isFinite(this.maxAttempts) || this.attempt <= this.maxAttempts;
  }

  public get isLastAttempt(): boolean {
    return this.attempt === this.maxAttempts;
  }
}

export { Delayer, StopFn, RetryFn, DelayInfo } from './common';
export { ExponentialDelayer };
export { RetriesFailed };
