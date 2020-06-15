interface HandlerTypes {
  [event: string]: (...args: any[]) => any;
}

export class EventEmitter<T extends HandlerTypes = {}> {
  private onHandlers: { [event in keyof T]?: Array<(...args: any[]) => any> };
  private onceHandlers: { [event in keyof T]?: Array<(...args: any[]) => any> };

  constructor() {
    this.onHandlers = {};
    this.onceHandlers = {};
  }

  on<K extends keyof T>(event: K, handler: T[K]) {
    const onHandlers = this.onHandlers[event];
    if (!onHandlers) {
      this.onHandlers[event] = [handler];
    } else {
      onHandlers.push(handler);
    }

    return () => {
      this.off(event, handler);
    };
  }

  once<K extends keyof T>(event: K, handler: T[K]) {
    const onceHandlers = this.onceHandlers[event];
    if (!onceHandlers) {
      this.onceHandlers[event] = [handler];
    } else {
      onceHandlers.push(handler);
    }

    return () => {
      this.off(event, handler);
    };
  }

  off<K extends keyof T>(event: K, handler?: T[K] | null) {
    if (!handler) {
      this.onHandlers[event] = [];
      this.onceHandlers[event] = [];
      return;
    }

    const onHandlers = this.onHandlers[event];
    const onceHandlers = this.onceHandlers[event];

    if (onHandlers) {
      this.onHandlers[event] = onHandlers.filter(h => {
        return h !== handler;
      });
    }

    if (onceHandlers) {
      this.onceHandlers[event] = onceHandlers.filter(h => {
        return h != handler;
      });
    }
  }

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
    const onHandlers = this.onHandlers[event];
    if (onHandlers) {
      onHandlers.forEach(handler => handler(...args));
    }

    const onceHandlers = this.onceHandlers[event];
    if (!onceHandlers) return;

    while (onceHandlers.length > 0) {
      const handler = onceHandlers.pop();
      if (!handler) return;

      handler(...args);
    }
  }

  offAllEvents() {
    this.onHandlers = {};
    this.onceHandlers = {};
  }
}
