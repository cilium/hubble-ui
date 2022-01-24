import _ from 'lodash';
import { observable, action, makeObservable } from 'mobx';

import InteractionStore from '~/store/stores/interaction';
import ServiceStore from '~/store/stores/service';
import ControlStore from '~/store/stores/controls';

import { Filters, filter } from '~/domain/filtering';
import { HubbleService, HubbleLink } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';
import { ServiceCard, Link } from '~/domain/service-map';
import { Flow } from '~/domain/flows';
import { EventEmitter } from '~/utils/emitter';

export enum EventKind {
  FlowsAdded = 'flows-added',
  LinkChanged = 'link-changed',
  ServiceChange = 'services-changed',
  ServicesSet = 'services-set',
}

type Events = {
  [EventKind.FlowsAdded]: (_: Flow[]) => void;
  [EventKind.LinkChanged]: (_: HubbleLink, ch: StateChange) => void;
  [EventKind.ServiceChange]: (_: HubbleService, ch: StateChange) => void;
  [EventKind.ServicesSet]: (_: HubbleService[]) => void;
};

export class StoreFrame extends EventEmitter<Events> {
  @observable
  public interactions: InteractionStore;

  @observable
  public services: ServiceStore;

  @observable
  public controls: ControlStore;

  public static empty(): StoreFrame {
    return new StoreFrame(
      new ControlStore(),
      new InteractionStore(),
      new ServiceStore(),
    );
  }

  public static emptyWithShared(controls: ControlStore) {
    return new StoreFrame(controls, new InteractionStore(), new ServiceStore());
  }

  constructor(
    controls: ControlStore,
    interactions: InteractionStore,
    services: ServiceStore,
  ) {
    super();
    makeObservable(this);

    this.interactions = interactions;
    this.services = services;
    this.controls = controls;
  }

  getServiceById(id: string) {
    return this.services.byId(id);
  }

  @action.bound
  flush() {
    this.interactions.clear();
    this.services.clear();
  }

  @action.bound
  applyServiceChange(svc: HubbleService, change: StateChange) {
    this.emit(EventKind.ServiceChange, svc, change);

    this.services.applyServiceChange(svc, change);
  }

  @action.bound
  applyServiceLinkChange(link: HubbleLink, change: StateChange) {
    this.emit(EventKind.LinkChanged, link, change);

    this.interactions.applyLinkChange(link, change);
    this.services.extractAccessPoint(link);
  }

  @action.bound
  addFlows(flows: Flow[]) {
    this.emit(EventKind.FlowsAdded, flows);

    return this.interactions.addFlows(flows);
  }

  @action.bound
  setServices(services: HubbleService[]) {
    this.services.set(services);

    this.emit(EventKind.ServicesSet, services);
  }

  @action.bound
  setActiveService(serviceId: string): boolean {
    return this.services.setActive(serviceId);
  }

  @action.bound
  toggleActiveService(serviceId: string): boolean {
    return this.services.toggleActive(serviceId);
  }

  @action.bound
  isCardActive(serviceId: string): boolean {
    return this.services.isCardActive(serviceId);
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
      this.services.addNewCard(cloned);

      if (rhs.services.isCardActive(cloned.id)) {
        this.services.setActive(cloned.id);
      }
    });

    this.interactions.addFlows(filteredFlows);
    this.interactions.addLinks(filteredLinks);

    return this;
  }

  clone() {
    return new StoreFrame(
      this.controls,
      this.interactions.clone(),
      this.services.clone(),
    );
  }

  cloneEmpty(): StoreFrame {
    return StoreFrame.empty();
  }

  public get amounts() {
    return {
      cards: this.services.cardsList.length,
      flows: this.interactions.flows.length,
      links: this.interactions.links.length,
    };
  }
}
