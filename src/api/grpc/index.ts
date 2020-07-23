import { UIClient } from '~backend/proto/ui/ui_grpc_web_pb';

import { API, CoreAPIv1, EventParams } from '~/api/general';
import {
  IEventStream,
  EventParamsSet,
  DataFilters,
} from '~/api/general/event-stream';
import { EventStream } from './event-stream';

export class APIv1 implements CoreAPIv1 {
  private client: UIClient;

  public static readonly defaultEventStreamParams = EventParamsSet.Namespaces;

  public constructor() {
    const schema = process.env.API_SCHEMA;
    const host = process.env.API_HOST;
    const port = process.env.API_PORT;
    const path = process.env.API_PATH;
    this.client = new UIClient(`${schema}://${host}:${port}${path}`);
  }

  public getEventStream(
    params?: EventParams,
    filters?: DataFilters,
  ): IEventStream {
    params = params || APIv1.defaultEventStreamParams;

    const request = EventStream.buildRequest(params, filters);
    const stream = this.client.getEvents(request);

    return new EventStream(stream);
  }
}

export default {
  v1: new APIv1(/* config could be here */),
} as API;
