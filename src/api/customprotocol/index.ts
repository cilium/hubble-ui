import { Options as BaseOptions, CustomProtocolAPI } from '~/api/customprotocol-core';
import { EventParams, EventParamsSet } from '~/api/general/event-stream';

import { Filters } from '~/domain/filtering';

import { ControlStream } from './control-stream';
import { ServiceMapStream } from './service-map-stream';

export type Options = BaseOptions & {};

export class BackendAPI extends CustomProtocolAPI {
  constructor(opts: Options) {
    super(opts);
  }

  public controlStream(): ControlStream {
    return new ControlStream(
      this.streamOpts({
        route: 'control-stream',
      }),
    );
  }

  public serviceMapStream(filters?: Filters, eventFlags?: EventParams | null): ServiceMapStream {
    return new ServiceMapStream(
      this.streamOpts({
        route: 'service-map-stream',
        filters,
        eventParams: Object.assign({}, EventParamsSet.EventStream, eventFlags),
      }),
    );
  }
}

export { ControlStream, ServiceMapStream };
