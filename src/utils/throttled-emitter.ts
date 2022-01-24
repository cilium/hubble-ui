import _ from 'lodash';

// NOTE: Isolated implementation of throttled emitter looks much simper than one
// NOTE: that is integrated into current EventEmitter.
export class ThrottledEmitter<T> {
  private handlers: Set<(_: T[]) => void> = new Set();
  private buffer: T[] = [];
  private throttler: () => void;

  constructor(ms: number) {
    const instantEmitter = () => {
      this.handlers.forEach(fn => fn(this.buffer.slice()));
      this.buffer = [];
    };

    if (ms < Number.EPSILON) {
      this.throttler = instantEmitter;
    } else {
      this.throttler = _.throttle(() => {
        instantEmitter();
      }, ms);
    }
  }

  public on(cb: (_: T[]) => void) {
    this.handlers.add(cb);

    return () => this.off(cb);
  }

  public off(cb: (_: T[]) => void) {
    this.handlers.delete(cb);
  }

  public emit(d: T | T[]) {
    this.buffer = this.buffer.concat(d);
    this.throttler();
  }
}
