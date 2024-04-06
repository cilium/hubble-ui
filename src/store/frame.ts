import { observable, action, makeObservable } from 'mobx';

import { InteractionStore } from '~/store/stores/interaction';
import { ServiceStore } from '~/store/stores/service';
import { NamespaceStore } from '~/store/stores/namespace';
import { ControlStore } from '~/store/stores/controls';

import { Filters, filter } from '~/domain/filtering';
import { HubbleService } from '~/domain/hubble';
import { Link, ServiceMap } from '~/domain/service-map';
import { Flow } from '~/domain/flows';
import { EventEmitter } from '~/utils/emitter';
import { NamespaceDescriptor } from '~/domain/namespaces';
import { ServiceChange, ServiceLinkChange } from '~/domain/events';

export enum EventKind {
  FlowsAdded = 'flows-added',
  FlowSummariesAdded = 'flow-summaries-added',
  LinksChanged = 'links-changed',
  ServiceChange = 'services-changed',
  ServicesSet = 'services-set',
  PolicyChanged = 'policy-changed',
  Flushed = 'flushed',
}

type Handlers = {
  [EventKind.FlowsAdded]: (_: Flow[]) => void;
  [EventKind.LinksChanged]: (_: ServiceLinkChange[]) => void;
  [EventKind.ServiceChange]: (_: ServiceChange[]) => void;
  [EventKind.ServicesSet]: (_: HubbleService[]) => void;
  [EventKind.Flushed]: (opts?: FlushOptions) => void;
};

export type FlushOptions = {
  namespaces?: boolean;
  preserveActiveCards?: boolean;
};

export class StoreFrame extends EventEmitter<Handlers> {
  @observable
  public interactions: InteractionStore;

  @observable
  public services: ServiceStore;

  @observable
  public namespaces: NamespaceStore;

  @observable
  public controls: ControlStore;

  public static empty(): StoreFrame {
    return new StoreFrame(
      new NamespaceStore(),
      new ControlStore(),
      new InteractionStore(),
      new ServiceStore(),
    );
  }

  public static emptyWithShared(controls: ControlStore, nss: NamespaceStore) {
    return new StoreFrame(nss, controls, new InteractionStore(), new ServiceStore());
  }

  constructor(
    namespaces: NamespaceStore,
    controls: ControlStore,
    interactions: InteractionStore,
    services: ServiceStore,
  ) {
    super();

    makeObservable(this);

    this.controls = controls;
    this.interactions = interactions;
    this.services = services;
    this.namespaces = namespaces;
  }

  getServiceById(id: string) {
    return this.services.byId(id);
  }

  public onFlushed(fn: Handlers[EventKind.Flushed]): this {
    this.on(EventKind.Flushed, fn);
    return this;
  }

  @action.bound
  public flush(opts?: FlushOptions) {
    opts = opts || { namespaces: false };

    this.interactions.clear();

    this.services.clear(opts);

    if (!!opts.namespaces) {
      this.namespaces.clear();
    }

    this.emit(EventKind.Flushed, opts);
  }

  @action.bound
  public applyServiceChange(ch: ServiceChange) {
    this.emit(EventKind.ServiceChange, [ch]);
    this.services.applyServiceChange(ch.service, ch.change);
  }

  @action.bound
  public applyServiceChanges(ch: ServiceChange[]) {
    this.services.applyServiceChanges(ch);
    this.emit(EventKind.ServiceChange, ch);
  }

  @action.bound
  public applyServiceLinkChanges(links: ServiceLinkChange[]) {
    links.forEach(link => {
      this.interactions.applyLinkChange(link.serviceLink, link.change);
      this.services.extractAccessPoint(link.serviceLink);
    });

    this.emit(EventKind.LinksChanged, links);
  }

  @action.bound
  public addFlows(flows: Flow[], ...args: any[]) {
    const addedStats = this.addFlowsInner(flows, ...args);

    this.emit(EventKind.FlowsAdded, flows);
    return addedStats;
  }

  @action.bound
  private addFlowsInner(flows: Flow[], ...args: any[]) {
    const addedStats = this.interactions.addFlows(flows, ...args);

    // NOTE: addFlows could add l7 interactions, so we need to update
    // NOTE: ServiceCard accessPoints
    this.updateServiceEndpoints();

    return addedStats;
  }

  @action.bound
  private updateServiceEndpoints() {
    this.interactions.l7endpoints.forEach((ports, serviceId) => {
      const card = this.services.cardsMap.get(serviceId);
      if (card == null) return;

      card.updateAccessPointsL7(ports);
    });
  }

  @action.bound
  upsertNamespaces(nsd: NamespaceDescriptor[]) {
    return this.namespaces.add(nsd);
  }

  @action.bound
  setServices(services: HubbleService[]) {
    this.services.set(services);

    this.emit(EventKind.ServicesSet, services);
  }

  @action.bound
  moveServices(to: StoreFrame): number {
    return this.services.moveTo(to.services);
  }

  @action.bound
  moveServiceLinks(to: StoreFrame) {
    return this.interactions.moveTo(to.interactions);
  }

  @action.bound
  applyFrame(rhs: StoreFrame, fltrs?: Filters): this {
    const filters = fltrs ?? Filters.default();

    const { flows, links, services } = filter(
      filters,
      rhs.interactions.flows,
      rhs.services.cardsMap,
      rhs.interactions.connections,
    );

    const filteredFlows: Flow[] = [];
    flows.forEach(f => {
      filteredFlows.push(f.clone());
    });

    const filteredLinks: Link[] = [];
    links.forEach(l => {
      filteredLinks.push(l.clone());
    });

    // NOTE: services is array of cloned service map cards
    services.forEach(cloned => {
      this.services.upsertService(cloned);
    });

    this.interactions.addFlows(filteredFlows);
    this.interactions.addLinks(filteredLinks);

    // NOTE: This method will also accumulate l7endpoints
    this.updateServiceEndpoints();

    return this;
  }

  @action.bound
  setFilters(f: Filters) {
    this.controls.setFilters(f);
    this.namespaces.setCurrent(f.namespace);
  }

  @action.bound
  public replaceServiceMap(sm: ServiceMap, opts?: FlushOptions) {
    this.flush(opts);
    this.interactions.addLinks(sm.linksList);
    this.services.replaceWithServiceMap(sm);
  }

  @action.bound
  public extendServiceMap(sm: ServiceMap) {
    console.log(`Frame extendServiceMap`);
    sm.log();

    this.interactions.upsertLinks(sm.linksList);
    this.services.extendWithServiceMap(sm);
  }

  clone() {
    return new StoreFrame(
      this.namespaces.clone(),
      this.controls,
      this.interactions.clone(),
      this.services.clone(),
    );
  }

  public get amounts() {
    return {
      cards: this.services.cardsList.length,
      flows: this.interactions.flows.length,
      links: this.interactions.links.length,
    };
  }
}
