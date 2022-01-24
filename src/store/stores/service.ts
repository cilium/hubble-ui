import _ from 'lodash';
import { action, observable, computed, reaction, makeObservable } from 'mobx';

import { Service, ServiceCard, Link, AccessPoint } from '~/domain/service-map';
import { HubbleLink, HubbleService } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';

export default class ServiceStore {
  @observable private cards: ServiceCard[];
  @observable private activeCardsSet: Set<string>;

  constructor() {
    makeObservable(this);
    this.cards = [];
    this.activeCardsSet = new Set();
  }

  clone(deep = false): ServiceStore {
    const store = new ServiceStore();

    store.cards = deep ? _.cloneDeep(this.cards) : this.cards.slice();
    store.activeCardsSet = new Set(this.activeCardsSet);

    return store;
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
    return new Set(this.activeCardsSet);
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
    const isActive = this.activeCardsSet.has(id);
    if (single) this.activeCardsSet.clear();

    isActive ? this.activeCardsSet.delete(id) : this.activeCardsSet.add(id);
    return !isActive;
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
  setActiveState(id: string, state: boolean, single = true) {
    if (single && !state) this.activeCardsSet.clear();

    state ? this.activeCardsSet.add(id) : this.activeCardsSet.delete(id);
  }

  @action.bound
  clearActive() {
    this.activeCardsSet.clear();
  }

  @action.bound
  set(services: Array<HubbleService>) {
    this.cards = services.map(ServiceCard.fromService);
  }

  @action.bound
  applyServiceChange(svc: HubbleService, change: StateChange) {
    if (change === StateChange.Deleted) {
      return this.deleteService(svc);
    }

    // TODO: handle all cases properly (patch current service)
    const existing = this.cardsMap.get(svc.id);
    if (existing != null) return;

    this.cards.push(ServiceCard.fromService(svc));
  }

  @action.bound
  deleteService(svc: HubbleService) {
    if (!this.cardsMap.has(svc.id)) return;

    const idx = this.cards.findIndex(s => s.id === svc.id);
    if (idx === -1) return;

    this.cards.splice(idx, 1);
    this.activeCardsSet.delete(svc.id);
  }

  @action.bound
  addNewCard(card: ServiceCard): boolean {
    const existing = this.cardsMap.get(card.id);
    if (existing != null) return false;

    this.cards.push(card);

    return true;
  }

  @action.bound
  moveTo(rhs: ServiceStore): number {
    let numAdded = 0;

    this.cardsList.forEach(card => {
      const added = rhs.addNewCard(card);
      numAdded += Number(added);
    });

    if (this.activeCardsSet.size !== 0) {
      const activeId = [...this.activeCardsSet][0];
      rhs.setActive(activeId);
    }

    return numAdded;
  }

  @action.bound
  extractAccessPoint(link: HubbleLink) {
    const accessPoint = AccessPoint.fromLink(link);
    const card = this.cardsMap.get(accessPoint.serviceId);
    if (card == null) return;

    card.addAccessPoint(accessPoint);
  }

  @action.bound
  extractAccessPoints(links: HubbleLink[]) {
    links.forEach(link => {
      this.extractAccessPoint(link);
    });
  }
}
