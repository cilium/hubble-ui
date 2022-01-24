import { API, CoreAPIv1 } from '~/api/general';
import { ControlStream as IControlStream } from '~/api/general/control-stream';
import { EventStream as IEventStream } from '~/api/general/event-stream';

import { EventStream } from './event-stream';
import { ControlStream as TestingControlStream } from './control-stream';

import { FeatureFlags } from '~/domain/features';

export class APIv1 implements CoreAPIv1 {
  public getEventStream(): IEventStream {
    return new EventStream();
  }

  public getControlStream(): IControlStream {
    return new TestingControlStream();
  }

  public async getFeatureFlags(): Promise<FeatureFlags> {
    return {};
  }
}

export default {
  v1: new APIv1(/* config could be here */),
} as API;
