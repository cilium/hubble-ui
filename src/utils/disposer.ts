import { ExtensibleFunction } from './types';

export type DisposeFn = () => void;

export class Disposer extends ExtensibleFunction {
  private subdisposers: Set<DisposeFn> = new Set();

  public static chain(fn: DisposeFn): Disposer {
    return new Disposer().chain(fn);
  }

  public static new(): Disposer {
    return new Disposer();
  }

  constructor() {
    super(() => {
      this.subdisposers.forEach(d => {
        d();
      });

      this.subdisposers.clear();
    });
  }

  public chain(fn: DisposeFn | Disposer | undefined): Disposer {
    if (!fn) return this;

    this.subdisposers.add(fn instanceof Disposer ? fn.asFunction() : fn);
    return this;
  }

  public asFunction(): DisposeFn {
    return this as any;
  }
}
