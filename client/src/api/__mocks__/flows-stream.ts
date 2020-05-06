import { IThrottledStream } from '~/api/general';
import { HubbleFlow } from '~/domain/flows';
import { flows } from './data';

export class FlowsStream implements IThrottledStream<HubbleFlow[]> {
  public subscribe(callback: (data: HubbleFlow[]) => void) {
    callback(flows);
    return () => void 0;
  }

  public stop() {
    void 0;
  }

  public get throttleDelay(): number {
    return 0;
  }
}
