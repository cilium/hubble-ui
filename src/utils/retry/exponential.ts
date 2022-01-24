import type { Delayer as IDelayer } from './common';

export interface Opts {
  maxDelay: number;
  minDelay: number;
  factor: number;
}

export class Delayer implements IDelayer {
  private opts: Opts;
  private delay: number;

  constructor(opts: Opts) {
    this.opts = opts;
    this.delay = opts.minDelay;
  }

  public clone() {
    return new Delayer(this.opts);
  }

  public async wait() {
    const currentDelay = this.delay;
    this.advanceDelay();

    await new Promise(resolve => {
      setTimeout(resolve, currentDelay);
    });
  }

  public reset() {
    this.delay = this.opts.minDelay;
  }

  public nextDelay() {
    return this.delay;
  }

  private advanceDelay() {
    this.delay = Math.min(this.delay * this.opts.factor, this.opts.maxDelay);
  }
}
