import _ from 'lodash';
import { makeAutoObservable } from 'mobx';

import { Link, ServiceCard, ServiceMap } from '~/domain/service-map';
import { HubbleLink, HubbleService, Workload } from '~/domain/hubble';
import { ServiceEndpoint } from '~/domain/interactions/endpoints';
import { StateChange } from '~/domain/misc';
import { ServiceChange } from '~/domain/events';
import { FilterEntry } from '~/domain/filtering/filter-entry';

export type ClearOptions = {};

export class ServiceStore {
  private cards: ServiceCard[];

  constructor() {
    this.cards = [];

    makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  clone(deep = false): ServiceStore {
    const store = new ServiceStore();

    store.cards = deep ? _.cloneDeep(this.cards) : this.cards.slice();

    return store;
  }

  public get cardsList() {
    return this.cards;
  }

  public get cardsMap() {
    const map = new Map<string, ServiceCard>();
    this.cardsList.forEach(card => map.set(card.service.id, card));
    return map;
  }

  // NOTE: Gives { identiy -> Card } map
  public get cardsIdentityMap() {
    const map = new Map<string, ServiceCard>();

    this.cardsList.forEach(card => {
      if (card.identity === 0) {
        console.warn(`card ${card.caption} has identity zero, wat?`, card);
        return;
      }

      const identityStr = card.identity.toString();
      if (map.has(identityStr)) {
        console.warn(`cards have equal identities, wat?`, card, map.get(identityStr));
        return;
      }

      map.set(identityStr, card);
    });

    return map;
  }

  // NOTE: Gives { dns domain -> Card } map
  public get cardsDomainMap() {
    const map = new Map<string, ServiceCard>();

    this.cardsList.forEach(card => {
      const domain = card.domain;
      if (!domain) return;

      if (map.has(domain)) {
        console.warn(`cards have equal domains`, card, map.get(domain));
        return;
      }

      map.set(domain, card);
    });

    return map;
  }

  // NOTE: Gives { workload.kind/workload.name -> Card } map
  public get cardWorkloadsMap() {
    const map = new Map<string, ServiceCard>();

    this.cardsList.forEach(card => {
      const workload = card.workload;
      if (workload == null) return;

      const key = `${workload.kind}/${workload.name}`;
      if (map.has(key)) {
        console.warn(`cards have equal workloads, wat?`, card, map.get(key));
        return;
      }

      map.set(key, card);
    });

    return map;
  }

  // This is for Cluster Mesh feature to show
  // cluster name on Service Map cards
  public get isClusterMeshed(): boolean {
    const seenClusters = new Set<string>();
    for (let i = 0; i < this.cardsList.length; i++) {
      const card = this.cardsList[i];
      if (card.clusterName) seenClusters.add(card.clusterName);
      // If there is more than 1 cluster name - then Cluster Mesh is enabled
      if (seenClusters.size > 1) return true;
    }
    return false;
  }

  public get byId() {
    return (id: string) => {
      return this.cardsMap.get(id);
    };
  }

  public byFilterEntry(filter: FilterEntry): ServiceCard | null | undefined {
    if (filter.isIdentity) {
      // NOTE: In this case filter.query is a string repr of identity and we are going to add
      // caption as a meta to make better look of FilterEntry
      return this.cardsIdentityMap.get(filter.query);
    } else if (filter.isDNS) {
      // NOTE: Here `filter.query` contains domain, and `getServiceId` on backend uses that domain
      // to generate an id for this UI card
      return this.cardsDomainMap.get(filter.query);
    } else if (filter.isWorkload) {
      // NOTE: In this case, query is workload name and meta is workload kind
      return this.byWorkload(filter.asWorkload());
    }

    return null;
  }

  public byWorkload(wl?: Workload | null) {
    if (wl == null) return void 0;

    const key = `${wl.kind}/${wl.name}`;
    return this.cardWorkloadsMap.get(key);
  }

  public clear(opts?: ClearOptions) {
    this.cards = [];
  }

  public hasOtherCardsWithTheSameCaption(card: ServiceCard): boolean {
    const caption = card.caption;
    return !!this.cardsList.find(c => c.id !== card.id && caption === c.caption);
  }

  public set(services: Array<HubbleService>) {
    this.cards = services.map(ServiceCard.fromService);
  }

  public applyServiceChange(svc: HubbleService, change: StateChange) {
    if (change === StateChange.Deleted) {
      return this.deleteService(svc);
    }

    if (change === StateChange.Modified) {
      return this.upsertService(svc);
    }

    // TODO: handle all cases properly
    const existing = this.cardsMap.get(svc.id);
    if (existing != null) return;

    this.cards.push(ServiceCard.fromService(svc));
  }

  public applyServiceChanges(changes: ServiceChange[]) {
    changes.forEach(ch => {
      this.applyServiceChange(ch.service, ch.change);
    });
  }

  public deleteService(svc: HubbleService) {
    if (!this.cardsMap.has(svc.id)) return;

    const idx = this.cards.findIndex(s => s.id === svc.id);
    if (idx === -1) return;

    this.cards.splice(idx, 1);
  }

  public upsertService(serviceLike: HubbleService | ServiceCard) {
    const svc =
      serviceLike instanceof ServiceCard ? serviceLike : ServiceCard.fromService(serviceLike);

    const existing = this.cardsMap.get(svc.id);
    if (existing == null) {
      this.cards.push(svc);
      return;
    }

    svc.accessPoints.forEach(svcEndpoint => {
      existing.upsertAccessPoint(svcEndpoint);
    });

    if (existing.identity === 0) {
      existing.setIdentity(svc.identity);
    }
  }

  public moveTo(rhs: ServiceStore): number {
    let numAdded = 0;

    this.cardsList.forEach(card => {
      const added = rhs.upsertService(card);
      numAdded += Number(added);
    });

    return numAdded;
  }

  public extractAccessPoint(link: HubbleLink | Link) {
    const accessPoint = ServiceEndpoint.fromLink(link);
    const card = this.cardsMap.get(accessPoint.serviceId);
    if (card == null) return;

    card.upsertAccessPoint(accessPoint);
  }

  public extractAccessPoints(links: HubbleLink[] | Link[]) {
    links.forEach(link => {
      this.extractAccessPoint(link);
    });
  }

  public replaceWithServiceMap(sm: ServiceMap) {
    this.set(sm.servicesList);
    this.extractAccessPoints(sm.linksList);
  }

  public extendWithServiceMap(sm: ServiceMap) {
    sm.servicesList.forEach(svc => {
      this.upsertService(svc);
    });

    this.extractAccessPoints(sm.linksList);
  }
}
