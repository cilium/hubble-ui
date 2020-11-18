import _ from 'lodash';
import { observable, action } from 'mobx';

import InteractionStore from '~/store/stores/interaction';
import ServiceStore from '~/store/stores/service';
import ControlStore from '~/store/stores/controls';

import {
  ServiceMapPlacementStrategy,
  ServiceMapArrowStrategy,
} from '~/domain/layout/service-map';

import { Filters, filter } from '~/domain/filtering';
import { HubbleService, HubbleLink } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';
import { ServiceCard, Link } from '~/domain/service-map';
import { Flow } from '~/domain/flows';
import { Vec2 } from '~/domain/geometry';

export class StoreFrame {
  @observable
  public controls: ControlStore;

  @observable
  public interactions: InteractionStore;

  @observable
  public services: ServiceStore;

  @observable
  public placement: ServiceMapPlacementStrategy;

  @observable
  public arrows: ServiceMapArrowStrategy;

  public initialFilters: Filters;

  public static empty(controls: ControlStore): StoreFrame {
    return new StoreFrame(new InteractionStore(), new ServiceStore(), controls);
  }

  constructor(
    interactions: InteractionStore,
    services: ServiceStore,
    controls: ControlStore,
  ) {
    this.interactions = interactions;
    this.services = services;
    this.controls = controls;

    this.initialFilters = controls.filters.clone(true);

    this.placement = new ServiceMapPlacementStrategy(
      this.controls,
      this.interactions,
      this.services,
    );

    this.arrows = new ServiceMapArrowStrategy(
      this.controls,
      this.interactions,
      this.services,
      this.placement,
    );
  }

  getServiceById(id: string) {
    return this.services.byId(id);
  }

  @action.bound
  applyServiceChange(svc: HubbleService, change: StateChange) {
    this.services.applyServiceChange(svc, change);
  }

  @action.bound
  addFlows(flows: Flow[]) {
    return this.interactions.addFlows(flows);
  }

  @action.bound
  applyServiceLinkChange(link: HubbleLink, change: StateChange) {
    this.interactions.applyLinkChange(link, change);
    this.services.extractAccessPoint(link);
  }

  @action.bound
  setServices(services: HubbleService[]) {
    this.services.set(services);
  }

  @action.bound
  setControls(controls: ControlStore) {
    this.controls = controls;
  }

  @action.bound
  setAccessPointCoords(apId: string, coords: Vec2) {
    this.placement.setAccessPointCoords(apId, coords);
  }

  @action.bound
  setCardHeight(cardId: string, height: number) {
    this.placement.setCardHeight(cardId, height);
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
      this.interactions.clone(),
      this.services.clone(),
      this.controls,
    );
  }

  cloneEmpty(): StoreFrame {
    const cloned = new StoreFrame(
      new InteractionStore(),
      new ServiceStore(),
      this.controls,
    );

    cloned.initialFilters = this.initialFilters;
    return cloned;
  }

  public get amounts() {
    return {
      cards: this.services.cardsList.length,
      flows: this.interactions.flows.length,
      links: this.interactions.links.length,
    };
  }
}
