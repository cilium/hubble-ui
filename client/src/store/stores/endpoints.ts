import { reaction, observable } from 'mobx';
import { IEndpoint } from '~/domain/mocked-data';
import { Endpoint } from '~/domain/endpoint';

export default class EndpointsStore {
  @observable
  public endpoints: Array<Endpoint>;

  @observable
  private map: Map<string, Endpoint>;

  constructor() {
    this.endpoints = [];
    this.map = new Map();

    reaction(
      () => this.endpoints,
      () => {
        this.rebuildIndex();
      },
    );
  }

  get data() {
    return this.endpoints;
  }

  get byId() {
    return (id: string) => {
      return this.map.get(id);
    };
  }

  public set(endpoints: Array<IEndpoint>) {
    this.endpoints = endpoints.map(Endpoint.fromObject);
  }

  private rebuildIndex() {
    console.info('rebuilding endpointsMap');

    this.endpoints.forEach(e => {
      this.map.set(e.id!, e);
    });
  }
}
