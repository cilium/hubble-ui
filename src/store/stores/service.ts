import _ from 'lodash';
import { makeAutoObservable } from 'mobx';

import { ServiceCard } from '~/domain/service-map';
import { HubbleLink, HubbleService } from '~/domain/hubble';
import { ServiceEndpoint } from '~/domain/interactions/endpoints';
import { StateChange } from '~/domain/misc';

export default class ServiceStore {
  private cards: ServiceCard[];
  private activeCardsSet: Set<string>;

  constructor() {
    this.cards = [];
    this.activeCardsSet = new Set();

    makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  clone(deep = false): ServiceStore {
    const store = new ServiceStore();

    store.cards = deep ? _.cloneDeep(this.cards) : this.cards.slice();
    store.activeCardsSet = new Set(this.activeCardsSet);

    return store;
  }

  public get cardsList() {
    return this.cards.slice();
  }

  public get cardsMap() {
    const map = new Map<string, ServiceCard>();
    this.cardsList.forEach(card => map.set(card.service.id, card));
    return map;
  }

  public get activeCards() {
    return new Set(this.activeCardsSet);
  }

  public get activeCardsList(): string[] {
    return Array.from(this.activeCardsSet);
  }

  /* For Cluster Mesh feature to show cluster name on Service Map cards */
  public get isClusterMeshed(): boolean {
    const seenClusters = new Set<string>();
    for (let i = 0; i < this.cardsList.length; i++) {
      const card = this.cardsList[i];
      if (card.clusterName) seenClusters.add(card.clusterName);
      /* If there's more than 1 cluster name, Cluster Mesh is enabled */
      if (seenClusters.size > 1) return true;
    }
    return false;
  }

  public get byId() {
    return (id: string) => {
      return this.cardsMap.get(id);
    };
  }

  public get isCardActive() {
    return (id: string) => {
      return this.activeCardsSet.has(id);
    };
  }

  public clear() {
    this.cards = [];
    this.activeCardsSet.clear();
  }

  public toggleActive(id: string, single = true): boolean {
    const isActive = this.activeCardsSet.has(id);
    if (single) this.activeCardsSet.clear();

    isActive ? this.activeCardsSet.delete(id) : this.activeCardsSet.add(id);
    return !isActive;
  }

  public setActive(id: string): boolean {
    const svc = this.cardsMap.get(id);
    if (!svc) return false;

    this.activeCardsSet.clear();
    this.activeCardsSet.add(id);

    return true;
  }

  public setActiveState(id: string, state: boolean, single = true) {
    if (single && !state) this.activeCardsSet.clear();

    state ? this.activeCardsSet.add(id) : this.activeCardsSet.delete(id);
  }

  public clearActive() {
    this.activeCardsSet.clear();
  }

  public set(services: Array<HubbleService>) {
    this.cards = services.map(ServiceCard.fromService);
  }

  public applyServiceChange(svc: HubbleService, change: StateChange) {
    if (change === StateChange.Deleted) {
      return this.deleteService(svc);
    }

    // TODO: handle all cases properly (patch current service)
    const existing = this.cardsMap.get(svc.id);
    if (existing != null) return;

    this.cards.push(ServiceCard.fromService(svc));
  }

  public deleteService(svc: HubbleService) {
    if (!this.cardsMap.has(svc.id)) return;

    const idx = this.cards.findIndex(s => s.id === svc.id);
    if (idx === -1) return;

    this.cards.splice(idx, 1);
    this.activeCardsSet.delete(svc.id);
  }

  public addNewCard(card: ServiceCard): boolean {
    const existing = this.cardsMap.get(card.id);
    if (existing != null) return false;

    this.cards.push(card);

    return true;
  }

  public moveTo(rhs: ServiceStore): number {
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

  public extractAccessPoint(link: HubbleLink) {
    const accessPoint = ServiceEndpoint.fromLink(link);
    const card = this.cardsMap.get(accessPoint.serviceId);
    if (card == null) return;

    card.addAccessPoint(accessPoint);
  }

  public extractAccessPoints(links: HubbleLink[]) {
    links.forEach(link => {
      this.extractAccessPoint(link);
    });
  }
}
