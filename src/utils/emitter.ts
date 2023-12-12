import { Disposer } from './disposer';

export type HandlerTypes<T = any> = {
  [K in keyof T]: (...args: any[]) => any;
};

export class EventEmitter<T extends HandlerTypes> {
  private onHandlers: Map<keyof T, Set<(...args: any[]) => any>>;
  private onceHandlers: Map<keyof T, Set<(...args: any[]) => any>>;

  private cachedEvents: Map<keyof T, any[][]> = new Map();
  private isCaching: boolean;

  private lastDisposerFn?: () => void;

  // NOTE: caching mode allows not to lose events when no handlers is assigned
  constructor(caching?: boolean) {
    this.onHandlers = new Map();
    this.onceHandlers = new Map();
    this.isCaching = !!caching;
  }

  public setCaching(c: boolean): this {
    this.isCaching = c;
    return this;
  }

  public disposer(root?: Disposer): Disposer {
    return (root ?? Disposer.new()).chain(this.lastDisposerFn);
  }

  public on<K extends keyof T>(event: K, handler: T[K]) {
    if (!this.onHandlers.has(event)) {
      this.onHandlers.set(event, new Set());
    }

    this.onHandlers.get(event)?.add(handler);
    this.emitCached(event, handler);

    this.lastDisposerFn = () => {
      this.off(event, handler);
    };

    return this.lastDisposerFn;
  }

  public once<K extends keyof T>(event: K, handler: T[K]) {
    if (!this.onceHandlers.has(event)) {
      this.onceHandlers.set(event, new Set());
    }

    this.onceHandlers.get(event)?.add(handler);
    this.emitCached(event, handler, true);

    this.lastDisposerFn = () => {
      this.off(event, handler);
    };

    return this.lastDisposerFn;
  }

  public off<K extends keyof T>(event: K, handler?: T[K] | null) {
    if (!handler) {
      this.onHandlers.get(event)?.clear();
      this.onceHandlers.get(event)?.clear();
      return;
    }

    this.onHandlers.get(event)?.delete(handler);
    this.onceHandlers.get(event)?.delete(handler);
  }

  public emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    const onHandlers = this.onHandlers.get(event);
    const onceHandlers = this.onceHandlers.get(event);

    if (this.isCaching && !onHandlers?.size && !onceHandlers?.size) {
      this.saveCached(event, args);
      return;
    }

    onHandlers?.forEach(fn => fn(...args));
    if (onceHandlers) {
      // NOTE: Handlers should be flushed first to avoid recursive calls in case
      // NOTE: if any of that handlers called .emit() again
      const handlers = new Set(onceHandlers);
      onceHandlers.clear();

      handlers.forEach(fn => fn(...args));
    }
  }

  public offAllEvents() {
    this.onHandlers.clear();
    this.onceHandlers.clear();
  }

  public hasHandlers<K extends keyof T>(evt: K): boolean {
    const hasOnHandlers = !!this.onHandlers.get(evt)?.size;
    const hasOnceHandlers = !!this.onceHandlers.get(evt)?.size;

    return hasOnHandlers || hasOnceHandlers;
  }

  protected getCachedEvents(): Map<keyof T, any[][]> {
    const cached = new Map();
    this.cachedEvents.forEach((payloads, evt) => {
      cached.set(evt, payloads.slice());
    });

    return cached;
  }

  protected moveCachedEventsTo(targetEmitter: EventEmitter<T>) {
    this.getCachedEvents().forEach((payloads, evt) => {
      payloads.forEach(payload => {
        targetEmitter.emit(evt, ...(payload as any));
        this.cachedEvents.set(evt, []);
      });
    });
  }

  protected dropCachedEvents<K extends keyof T>(eventsToDrop: K[]) {
    eventsToDrop.forEach(evt => {
      this.cachedEvents.set(evt, []);
    });
  }

  private emitCached<K extends keyof T>(evt: K, handler: T[K], once?: boolean) {
    const cached = this.cachedEvents.get(evt);
    if (!cached || cached.length === 0) return;

    if (!!once) {
      const datum = cached.shift();
      this.onceHandlers.get(evt)?.delete(handler);

      datum && handler(...datum);
      return;
    }

    cached.forEach(args => handler(...args));
    this.cachedEvents.set(evt, []);
  }

  private saveCached<K extends keyof T>(evt: K, args: any[]) {
    if (!this.cachedEvents.has(evt)) {
      this.cachedEvents.set(evt, []);
    }

    this.cachedEvents.get(evt)?.push(args);
  }
}
