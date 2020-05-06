import { ObserverClient } from '~/../../common/src/types/hubble/observer/observer_grpc_web_pb';
import { API, CoreAPIv1 } from '~/api/general';
import { endpoints, links } from './__mocks__/data';
import { FlowsStream } from './flows-stream';

export { FlowsStream };

export class APIv1 implements CoreAPIv1 {
  private client: ObserverClient;

  public constructor() {
    this.client = new ObserverClient('http://127.0.0.1:8080');
  }

  public getFlowsStream(params: Parameters<CoreAPIv1['getFlowsStream']>[0]) {
    const request = FlowsStream.buildGrpcRequest(params);
    const stream = this.client.getFlows(request);
    return new FlowsStream(stream);
  }

  async getServices() {
    return Promise.resolve(endpoints);
  }

  async getLinks() {
    return Promise.resolve(links);
  }

  async getNamespaces(): Promise<Array<string>> {
    const namespaces: Array<string> = ['default', 'kube-system'];

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
