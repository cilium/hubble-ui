import { ClientReadableStream } from 'grpc-web';
import { ControlStream as IControlStream } from '~/api/general/control-stream';
import { GRPCStream } from '~/api/grpc/stream';

export class ControlStream
  extends GRPCStream<number>
  implements IControlStream
{
  constructor() {
    super(new ClientReadableStream());
  }

  public onNamespaceChange() {
    return;
  }

  public onNotification() {
    return;
  }
}
