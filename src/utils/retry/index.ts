import { TimerId } from '~/utils/common';

import { Delayer, RetryFn, TickFn, DelayInfo } from './common';
import { Delayer as ExponentialDelayer } from './exponential';

export class Retries {
  private delayer: Delayer;
  private attempt = 1;
  private onTickHandlers: Set<TickFn> = new Set();
  private tickDelay = 100;
  private tickTimer: TimerId | null = null;

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
    this.delayer = delayer;
    this.maxAttempts = maxAttempts;
  }

  public clone(): Retries {
    return new Retries(this.delayer.clone(), this.maxAttempts);
  }

  public async try<T>(fn: RetryFn<T>): Promise<T | null> {
    while (this.canDoAttempt) {
      let stop = false;

      try {
        let result = fn(this.attempt, () => {
          stop = true;
        });

        if (result instanceof Promise) {
          result = await result;
        }

        return result;
      } catch (err) {
        if (stop || this.isLastAttempt) throw err;

        this.runTicking(this.delayer.nextDelay());
        await this.delayer.wait();
      }

      this.attempt += 1;
      if (stop) return null;
    }

    throw new Error('maxAttempts limit exceeded');
  }

  public onTick(tickFn: TickFn) {
    this.onTickHandlers.add(tickFn);
    return this;
  }

  public offTick(tickFn: TickFn) {
    return this.onTickHandlers.delete(tickFn);
  }

  public offTicks() {
    this.onTickHandlers.clear();
  }

  public reset() {
    this.delayer.reset();
    this.attempt = 1;
  }

  public get canDoAttempt(): boolean {
    return (
      !Number.isFinite(this.maxAttempts) || this.attempt <= this.maxAttempts
    );
  }

  public get isLastAttempt(): boolean {
    return this.attempt === this.maxAttempts;
  }

  private runTicking(delay: number) {
    const tickInfo: DelayInfo = {
      delay,
      tick: this.tickDelay,
      elapsed: 0,
      remaining: delay,
    };

    // NOTE: call all handlers to notify that we just get to waiting state
    this.onTickHandlers.forEach(fn => fn(tickInfo));

    this.tickTimer = setInterval(() => {
      tickInfo.elapsed += tickInfo.tick;
      tickInfo.remaining = Math.max(0, tickInfo.remaining - tickInfo.tick);

      this.onTickHandlers.forEach(fn => fn(tickInfo));

      if (tickInfo.remaining < Number.EPSILON) {
        clearInterval(this.tickTimer!);
      } else if (tickInfo.remaining < tickInfo.tick) {
        clearInterval(this.tickTimer!);

        setTimeout(() => {
          tickInfo.elapsed = delay;
          tickInfo.remaining = 0;
          this.onTickHandlers.forEach(fn => fn(tickInfo));
        }, tickInfo.remaining);
      }
    }, this.tickDelay);
  }
}

export { Delayer, StopFn, RetryFn, DelayInfo } from './common';
export { ExponentialDelayer };
