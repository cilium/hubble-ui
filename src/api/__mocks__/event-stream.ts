import { ClientReadableStream } from 'grpc-web';
import { EventStream as IEventStream } from '~/api/general/event-stream';
import { GRPCStream } from '~/api/grpc/stream';

import { Filters } from '~/domain/filtering';

export class EventStream extends GRPCStream<number> implements IEventStream {
  public readonly flowsDelay = 10;
  public readonly filters = Filters.default();

  constructor() {
    super(new ClientReadableStream());
  }

  public onFlow() {
    return;
  }

  public onFlows() {
    return;
  }

  public onRawFlow() {
    return;
  }

  public onNamespaceChange() {
    return;
  }

  public onServiceChange() {
    return;
  }

  public onServiceLinkChange() {
    return;
  }

  public onNotification() {
    return;
  }
}
