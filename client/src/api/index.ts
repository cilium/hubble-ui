import { endpoints } from './mock';
import { Flow } from '~/domain/data';
import { IEndpoint } from '~/domain/endpoint';

export interface CoreAPIv1 {
  fetchFlows: () => Promise<Array<Flow>>;
  fetchEndpoints: () => Promise<Array<IEndpoint>>;
  getNamespaces: () => Promise<Array<string>>;
}

export interface API {
  v1: CoreAPIv1;
}

export class APIv1 implements CoreAPIv1 {
  async fetchFlows(): Promise<Array<Flow>> {
    return Promise.resolve([]);
  }

  async fetchEndpoints(): Promise<Array<IEndpoint>> {
    return Promise.resolve(endpoints);
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
