import { EventEmitter } from './emitter';

type TimerId = ReturnType<typeof setInterval>;

interface TickDescriptor<K> {
  name: K;
  timerId: TimerId;
  delay: number;
}

type Handlers<T extends keyof any> = {
  [P in T]: () => void;
};

export class Ticker<K extends keyof any> extends EventEmitter<Handlers<K>> {
  private ticks: Map<string, TickDescriptor<K>>;

  constructor() {
    super();

    this.ticks = new Map();
  }

  public start(tickName: K, delay: number) {
    const current = this.ticks.get(tickName as string);
    if (current != null) {
      clearInterval(current.timerId);
    }

    const timerId = setInterval(() => {
      (this.emit as any)(tickName);
    }, delay);

    this.ticks.set(tickName as string, {
      name: tickName,
      timerId,
      delay,
    });
  }

  public stop(tickName: string) {
    const desc = this.ticks.get(tickName);
    if (desc == null) return;

    clearInterval(desc.timerId);
    this.ticks.delete(tickName);
  }

  public delayOf(tickName: string): number | undefined {
    const desc = this.ticks.get(tickName);
    if (desc == null) return undefined;

    return desc.delay;
  }
}
