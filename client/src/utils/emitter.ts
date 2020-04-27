export class EventEmitter {
  private onHandlers: { [key: string]: Array<(...args: any[]) => any> };
  private onceHandlers: { [key: string]: Array<(...args: any[]) => any> };

  constructor() {
    this.onHandlers = {};
    this.onceHandlers = {};
  }

  on(event: string, handler: (...args: any[]) => any) {
    if (this.onHandlers[event] == null) {
      this.onHandlers[event] = [handler];
    } else {
      this.onHandlers[event].push(handler);
    }
    return () => {
      this.off(event, handler);
    };
  }

  once(event: string, handler: (...args: any[]) => any) {
    if (this.onceHandlers[event] === null) {
      this.onceHandlers[event] = [handler];
    } else {
      this.onceHandlers[event].push(handler);
    }
    return () => {
      this.off(event, handler);
    };
  }

  off(event: string, handler: Function) {
    if (handler == null) {
      this.onHandlers[event] = [];
      this.onceHandlers[event] = [];
      return;
    }

    const onHandlers = this.onHandlers[event];
    const onceHandlers = this.onceHandlers[event];

    if (onHandlers != null) {
      this.onHandlers[event] = onHandlers.filter((h: Function) => {
        return h !== handler;
      });
    }

    if (onceHandlers != null) {
      this.onceHandlers[event] = onceHandlers.filter((h: Function) => {
        return h != handler;
      });
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.onHandlers[event] != null) {
      this.onHandlers[event].forEach((handler: Function) => {
        handler(...args);
      });
    }

    const onceHandlers = this.onceHandlers[event];
    if (onceHandlers == null) return;

    while (onceHandlers.length > 0) {
      const handler = onceHandlers.pop();
      if (handler) {
        handler(...args);
      }
    }
  }
}
