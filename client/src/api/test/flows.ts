import { IStream } from '~/api';
import { HubbleFlow } from '~/domain/flows';
import { flows } from '~/api/mock';

export class FlowsStream implements IStream<HubbleFlow[]> {
  public subscribe(callback: (data: HubbleFlow[]) => void) {
    return () => callback(flows);
  }

  public stop() {
    void 0;
  }
}
