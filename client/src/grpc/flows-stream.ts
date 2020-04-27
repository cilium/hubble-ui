import { ObserverClient } from '~/../../common/src/types/hubble/observer/observer_grpc_web_pb';
import { APIStream } from '~/api';
import { IFlow } from '~/domain/flows';
import { EventEmitter } from '~/utils/emitter';

export type HubbleGetFlowsReturnType = ReturnType<ObserverClient['getFlows']>;

export class FlowsStream extends EventEmitter implements APIStream<IFlow[]> {
  public static readonly TOPIK = 'flows-received';

  private stream: HubbleGetFlowsReturnType;

  public constructor(stream: HubbleGetFlowsReturnType) {
    super();
    this.stream = stream;
    this.setup();
  }

  public subscribe(callback: (data: IFlow[]) => void) {
    return this.on(FlowsStream.TOPIK, callback);
  }

  public stop() {
    this.stream.cancel();
  }

  private setup() {
    this.stream.on('data', response => {
      const flow = response.getFlow();
      if (flow && response.hasFlow()) {
        this.emit(FlowsStream.TOPIK, [flow.toObject()]);
        this.stream.cancel();
      }
    });

    this.stream.on('status', status => {
      console.log(status.code);
      console.log(status.details);
      console.log(status.metadata);
    });

    this.stream.on('end', () => {
      console.log('flows stream ended');
    });
  }
}
