import { IFlow } from '~/domain/flows';
import { Service } from '~/domain/service-map';
import { endpoints, flows } from './mock';

export interface CoreAPIv1 {
  getFlows: () => Promise<Array<IFlow>>;
  getServices: () => Promise<Array<Service>>;
  getNamespaces: () => Promise<Array<string>>;
}

export interface API {
  v1: CoreAPIv1;
}

export class APIv1 implements CoreAPIv1 {
  async getFlows(): Promise<Array<IFlow>> {
    return Promise.resolve(flows);
  }

  async getServices(): Promise<Array<Service>> {
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
