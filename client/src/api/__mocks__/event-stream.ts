import { EventEmitter } from '~/utils/emitter';
import { IEventStream, EventStreamHandlers } from '~/api/general';

export class EventStream extends EventEmitter<EventStreamHandlers> {
  constructor() {
    super();
  }

  async stop() {
    return;
  }

  public get flowsDelay(): number {
    return 2000;
  }
}
