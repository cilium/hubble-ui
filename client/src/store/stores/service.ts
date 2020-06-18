import { action, observable, computed } from 'mobx';

import { ServiceCard } from '~/domain/service-card';
import { Link, Service } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';

export default class ServiceStore {
  @observable private cards: ServiceCard[];
  @observable private activeCardsSet: Set<string>;

  constructor() {
    this.cards = [];
    this.activeCardsSet = new Set();
  }

  @computed get cardsList() {
    return this.cards.slice();
  }

  @computed get cardsMap() {
    const map = new Map<string, ServiceCard>();
    this.cardsList.forEach(card => map.set(card.service.id, card));
    return map;
  }

  @computed get activeCards() {
    return this.activeCardsSet;
  }

  @computed get activeCardsList(): string[] {
    return Array.from(this.activeCardsSet);
  }

  @computed get byId() {
    return (id: string) => {
      return this.cardsMap.get(id);
    };
  }

  @computed get isCardActive() {
    return (id: string) => {
      return this.activeCardsSet.has(id);
    };
  }

  @action.bound
  clear() {
    this.cards = [];
    this.activeCardsSet.clear();
  }

  @action.bound
  toggleActive(id: string, single = true): boolean {
    const current = this.activeCardsSet.has(id);
    if (single) this.activeCardsSet.clear();

    current ? this.activeCardsSet.delete(id) : this.activeCardsSet.add(id);
    return !current;
  }

  @action.bound
  setActive(id: string): boolean {
    const svc = this.cardsMap.get(id);
    if (!svc) return false;

    this.activeCardsSet.clear();
    this.activeCardsSet.add(id);

    return true;
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
    this.activeCardsSet.delete(svc.id);
  }
}
