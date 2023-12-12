import { EventEmitter } from './emitter';
import { DisposeFn } from './disposer';

export enum TimerEvent {
  Started = 'started',
  Timeout = 'timeout',
  Stopped = 'stopped',
}

export type Handlers = {
  [TimerEvent.Started]: () => void;
  [TimerEvent.Timeout]: () => void;
  [TimerEvent.Stopped]: () => void;
};

export class Timer extends EventEmitter<Handlers> {
  protected timerDisposer: DisposeFn | null = null;
  private duration: number;

  public static new(dur: number): Timer {
    return new Timer(dur);
  }

  constructor(dur: number) {
    super();

    this.duration = dur;
  }

  public get isSet() {
    return this.timerDisposer != null;
  }

  public onStarted(fn: () => void): this {
    this.on(TimerEvent.Started, fn);
    return this;
  }

  public onTimeout(fn: () => void): this {
    this.on(TimerEvent.Timeout, fn);
    return this;
  }

  public onStopped(fn: () => void): this {
    this.on(TimerEvent.Stopped, fn);
    return this;
  }

  public stop(): this {
    if (this.timerDisposer != null) {
      this.timerDisposer();
      this.emit(TimerEvent.Stopped);
    }

    this.timerDisposer = null;
    return this;
  }

  public start(): this {
    if (this.timerDisposer != null) return this;

    this.emit(TimerEvent.Started);

    this.timerDisposer = this.startTimer(() => {
      this.timerDisposer = null;
      this.emit(TimerEvent.Timeout);
    }, this.duration);

    return this;
  }

  public run(): this {
    return this.start();
  }

  public reset(ms?: number): this {
    this.stop();

    if (ms != null) {
      this.duration = ms;
    }

    this.start();
    return this;
  }

  protected startTimer(fn: Function, ms: number): DisposeFn {
    const timerId = setTimeout(fn, ms);

    return () => clearTimeout(timerId);
  }
}

export class Ticker extends Timer {
  public static new(dur: number): Ticker {
    return new Ticker(dur);
  }

  constructor(dur: number) {
    super(dur);
  }

  public onTick(fn: Handlers[TimerEvent.Timeout]): this {
    return this.onTimeout(fn);
  }

  protected startTimer(fn: Function, ms: number): DisposeFn {
    const intervalId = setInterval(fn, ms);

    return () => clearInterval(intervalId);
  }
}
