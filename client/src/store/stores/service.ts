import { reaction, observable } from 'mobx';

import { ServiceCard } from '~/domain/service-card';
import { Service } from '~/domain/service-map';

export default class ServiceStore {
  @observable
  public cards: Array<ServiceCard>;

  @observable
  private map: Map<string, ServiceCard>;

  constructor() {
    this.cards = [];
    this.map = new Map();

    reaction(
      () => this.cards,
      () => {
        this.rebuildIndex();
      },
    );
  }

  get data() {
    return this.cards;
  }

  get byId() {
    return (id: string) => {
      return this.map.get(id);
    };
  }

  public set(services: Array<Service>) {
    this.cards = services.map(ServiceCard.fromService);
  }

  private rebuildIndex() {
    console.info('rebuilding endpointsMap');

    this.cards.forEach(c => {
      this.map.set(c.service.id, c);
    });
  }
}
