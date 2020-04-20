import { reaction, autorun, observable, action } from 'mobx';

import { ServiceCard } from '~/domain/service-card';
import { Service } from '~/domain/service-map';

export default class ServiceStore {
  @observable
  public cards: Array<ServiceCard>;

  @observable
  public active: Map<string, boolean>;

  @observable
  private map: Map<string, ServiceCard>;

  constructor() {
    this.cards = [];
    this.map = new Map();
    this.active = new Map();

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

  get activeSet(): Set<string> {
    const k = [...this.active.keys()].filter(key => !!this.active.get(key)!);
    return new Set(k);
  }

  public toggleActive(id: string) {
    const current = !!this.active.get(id);
    this.active.set(id, !current);
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
