import { UIClient } from '~backend/proto/ui/ui_grpc_web_pb';
import { GetControlStreamRequest } from '~backend/proto/ui/ui_pb';

import { API, CoreAPIv1, EventParams } from '~/api/general';
import {
  EventStream as IEventStream,
  EventParamsSet,
} from '~/api/general/event-stream';
import { ControlStream as IControlStream } from '~/api/general/control-stream';
import { EventStream } from './event-stream';
import { ControlStream } from './control-stream';

import { Filters } from '~/domain/filtering';
import { FeatureFlags } from '~/domain/features';

export class APIv1 implements CoreAPIv1 {
  private client: UIClient;

  public static readonly defaultEventStreamParams = EventParamsSet.Namespaces;

  public constructor() {
    const schema = process.env.API_SCHEMA;
    const host = process.env.API_HOST;
    const port = process.env.API_PORT;
    const path = process.env.API_PATH ?? '';

    let addr = `${schema}://${host}:${port}${path}`;
    if (process.env.NODE_ENV !== 'development') {
      const origin = document.location.origin.replace(/(.*)\/$/, '$1');
      const pathname = document.location.pathname.replace(/(.*)\/$/, '$1');
      addr = `${origin}${pathname}${path}`;
    }

    this.client = new UIClient(addr);
  }

  public getEventStream(params?: EventParams, filters?: Filters): IEventStream {
    const streamFn = () => {
      params = params ?? APIv1.defaultEventStreamParams;
      filters = filters ?? Filters.default();

      const req = EventStream.buildRequest(params, filters);
      return this.client.getEvents(req);
    };

    return new EventStream(streamFn()).withReconnecting(streamFn);
  }

  public getControlStream(): IControlStream {
    const requestFn = () => {
      const req = new GetControlStreamRequest();
      return this.client.getControlStream(req);
    };

    return ControlStream.new(requestFn()).withReconnecting(requestFn);
  }

  public async getFeatureFlags(): Promise<FeatureFlags> {
    return new Promise((resolve, reject) => {
      resolve({});
    });
  }
}

export default {
  v1: new APIv1(/* config could be here */),
} as API;
