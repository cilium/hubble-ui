export type RetryFn<T> = (att: number, stop: StopFn) => T | Promise<T>;
export type TickFn = (delayInfo: DelayInfo) => void;
export type StopFn = () => void;

// NOTE: nextDelay should return a delay which will be used on wait() call
export interface Delayer {
  nextDelay: () => number;
  reset: () => void;
  wait: () => Promise<void>;
  clone: () => Delayer;
}

export type DelayInfo = {
  delay: number;
  tick: number;
  elapsed: number;
  remaining: number;
};
