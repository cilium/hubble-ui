import { action, observable, reaction, computed } from 'mobx';
import { ServiceCard } from '~/domain/service-card';
import { Link, Service } from '~/domain/service-map';

export default class ServiceStore {
  @observable cards: Array<ServiceCard>;

  @observable active: Map<string, boolean>;

  @observable cardsMap: Map<string, ServiceCard>;

  constructor() {
    this.cards = [];
    this.cardsMap = new Map();
    this.active = new Map();

    reaction(
      () => this.cards,
      () => {
        this.rebuildIndex();
      },
    );
  }

  @computed get data() {
    return this.cards;
  }

  @computed get byId() {
    return (id: string) => {
      return this.cardsMap.get(id);
    };
  }

  @computed get activeSet(): Set<string> {
    const k = [...this.active.keys()].filter(key =>
      Boolean(this.active.get(key)),
    );
    return new Set(k);
  }

  @action.bound
  toggleActive(id: string) {
    const current = !!this.active.get(id);
    this.active.set(id, !current);
  }

  @action.bound
  set(services: Array<Service>) {
    this.cards = services.map(ServiceCard.fromService);
  }

  @action.bound
  updateLinkEndpoints(links: Array<Link>) {
    links.forEach((l: Link) => {
      const card = this.cardsMap.get(l.destinationId);
      if (card == null) return;

      card.updateLinkEndpoint(l);
    });
  }

  @action.bound
  rebuildIndex() {
    this.cards.forEach(c => {
      this.cardsMap.set(c.service.id, c);
    });
  }
}
