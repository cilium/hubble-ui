import { ClientReadableStream } from 'grpc-web';

import { GetControlStreamResponse as StreamResponse } from '~backend/proto/ui/ui_pb';
import { Notification as PBNotification } from '~backend/proto/ui/notifications_pb';

import {
  ControlStream as IControlStream,
  Handlers,
} from '~/api/general/control-stream';
import { GRPCStream, GRPCStreamEvent, Options } from '~/api/grpc/stream';

import * as helpers from '~/domain/helpers';

type UnderlyingStream = ClientReadableStream<StreamResponse>;
const StreamEventKind = StreamResponse.EventCase;

export class ControlStream
  extends GRPCStream<StreamResponse, Handlers>
  implements IControlStream
{
  public static new(stream: UnderlyingStream): ControlStream {
    return new ControlStream(stream);
  }

  constructor(stream: UnderlyingStream, opts?: Options<StreamResponse>) {
    super(stream, opts);

    this.setupEventHandlers();
  }

  public onNamespaceChange(cb: Handlers['onNamespaceChange']) {
    this.on('onNamespaceChange', cb);
  }

  public onNotification(cb: Handlers['onNotification']) {
    this.on('onNotification', cb);
  }

  private setupEventHandlers() {
    this.on(GRPCStreamEvent.Data, (res: StreamResponse) => {
      const eventKind = res.getEventCase();

      switch (eventKind) {
        case StreamEventKind.EVENT_NOT_SET:
          return;
        case StreamEventKind.NAMESPACES:
          return this.emitNamespaces(res.getNamespaces());
        case StreamEventKind.NOTIFICATION:
          return this.emitNotification(res.getNotification());
      }
    });
  }

  private emitNamespaces(nss?: StreamResponse.NamespaceStates) {
    nss?.getNamespacesList().forEach(ns => {
      const nsDesc = ns.getNamespace();
      if (nsDesc == null) return;

      this.emit('onNamespaceChange', {
        namespace: nsDesc.getName(),
        change: helpers.stateChangeFromPb(ns.getType()),
      });
    });
  }

  private emitNotification(notif?: PBNotification) {
    if (!notif) return;

    const notification = helpers.notifications.fromPb(notif);
    if (notification == null) {
      console.error('invalid notification pb received: ', notif);
      return;
    }

    this.emit('onNotification', notification);
  }
}
