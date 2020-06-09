import { action, observable, reaction, computed } from 'mobx';

import { ServiceCard } from '~/domain/service-card';
import { Link, Service } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';

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

  @action.bound
  clear() {
    this.cards = [];
    this.cardsMap.clear();
    this.active.clear();
  }

  @computed get data() {
    return this.cards.slice();
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

  @action.bound
  applyServiceChange(svc: Service, change: StateChange) {
    if (change === StateChange.Deleted) {
      return this.deleteService(svc);
    }

    // TODO: handle all cases properly (patch current service)
    const idx = this.cards.findIndex(s => s.id === svc.id);
    if (idx !== -1) return;

    this.cards.push(ServiceCard.fromService(svc));
  }

  @action.bound
  deleteService(svc: Service) {
    if (!this.cardsMap.has(svc.id)) return;

    const idx = this.cards.findIndex(s => s.id === svc.id);
    if (idx === -1) return;

    this.cards.splice(idx, 1);
    this.active.delete(svc.id);
  }
}
