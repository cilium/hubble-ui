import { EventEmitter } from '~/utils/emitter';

export enum Event {
  Open = 'open',
}

export type Handlers = {
  [Event.Open]: () => void;
};

export class WidgetControl extends EventEmitter<Handlers> {
  constructor(isCached = true) {
    super(isCached);
  }

  public onOpen(fn: Handlers[Event.Open]): this {
    this.on(Event.Open, fn);
    return this;
  }

  public open(): this {
    this.emit(Event.Open);
    return this;
  }
}
