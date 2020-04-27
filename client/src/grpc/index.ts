import { ObserverClient } from '~/../../common/src/types/hubble/observer/observer_grpc_web_pb';
import { GetFlowsRequest } from '~/../../common/src/types/hubble/observer/observer_pb';
import { API, CoreAPIv1 } from '~/api';
import { FlowsStream } from './flows-stream';
import { endpoints, links } from './mock';

export class APIv1 implements CoreAPIv1 {
  private client: ObserverClient;

  public constructor() {
    this.client = new ObserverClient('http://127.0.0.1:8080');
  }

  public getFlowsStream(request = new GetFlowsRequest()) {
    request.setNumber(1);
    request.setFollow(true);
    const stream = this.client.getFlows(request, {});
    return new FlowsStream(stream);
  }

  async getServices() {
    return Promise.resolve(endpoints);
  }

  async getLinks() {
    return Promise.resolve(links);
  }

  async getNamespaces(): Promise<Array<string>> {
    const namespaces: Array<string> = [
      'namespace-1',
      'namespace-2',
      'namespace-3',
    ];

    const delay = 1 + 2 * Math.random();

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(namespaces);
      }, delay);
    });
  }
}

export default {
  v1: new APIv1(/* config could be here */),
} as API;
