import { API, CoreAPIv1 } from '~/api/general';
import { endpoints, links } from './data';
import { FlowsStream } from './flows-stream';

export class APIv1 implements CoreAPIv1 {
  public getFlowsStream() {
    return new FlowsStream();
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
