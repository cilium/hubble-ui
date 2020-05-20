import { API, CoreAPIv1, IEventStream } from '~/api/general';
import { endpoints, links } from './data';
import { EventStream } from './event-stream';

export { EventStream };

export class APIv1 implements CoreAPIv1 {
  public getEventStream(): IEventStream {
    return new EventStream();
  }
}

export default {
  v1: new APIv1(/* config could be here */),
} as API;
