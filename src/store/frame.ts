import _ from 'lodash';
import { observable, action } from 'mobx';

import InteractionStore from '~/store/stores/interaction';
import ServiceStore from '~/store/stores/service';
import ControlStore from '~/store/stores/controls';

import {
  ServiceMapPlacementStrategy,
  ServiceMapArrowStrategy,
} from '~/domain/layout/service-map';

import { Filters, filterFlow, filterService } from '~/domain/filtering';
import { Link } from '~/domain/service-map';
import { HubbleService, HubbleLink } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';
import { ServiceCard } from '~/domain/service-map';
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

  constructor(
    interactions: InteractionStore,
    services: ServiceStore,
    controls: ControlStore,
  ) {
    this.interactions = interactions;
    this.services = services;
    this.controls = controls;

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
  filter(filters: Filters): StoreFrame {
    const services = new ServiceStore();
    const interactions = new InteractionStore();
    const flows: Flow[] = [];
    const links: Link[] = [];

    const allowedServiceIds: Set<string> = new Set();
    const allowedLinkIds: Set<string> = new Set();

    const extractServiceAndLinks = (obj: Map<string, Map<string, Link>>) => {
      obj?.forEach((accessPointsMap, serviceId: string) => {
        const svc = this.services.cardsMap.get(serviceId);
        if (!svc) return;

        if (filters.skipHost && svc.isHost) return;
        if (filters.skipKubeDns && svc.isKubeDNS) return;
        if (filters.skipRemoteNode && svc.isRemoteNode) return;
        if (filters.skipPrometheusApp && svc.isPrometheusApp) return;

        services.addNewCard(svc);

        accessPointsMap.forEach((link: Link, accessPointId: string) => {
          allowedLinkIds.add(link.id);
        });
      });
    };

    this.interactions.flows.forEach((f: Flow) => {
      if (!filterFlow(f, filters)) return;

      flows.push(f.clone());
    });

    const connections = this.interactions.connections;
    this.services.cardsList.forEach((card: ServiceCard) => {
      if (!filterService(card, filters)) return;

      // NOTE: card.id might be not simple identity (number)
      services.addNewCard(card.clone());
      allowedServiceIds.add(card.id);

      if (this.services.isCardActive(card.id)) {
        services.setActive(card.id);
      }
    });

    // NOTE: tricky point here: if this loop is placed inside previous loop
    // services and links that were skipped by filters can be saved :(
    allowedServiceIds.forEach((svcId: string) => {
      const outgoings = connections.outgoings.get(svcId);
      const incomings = connections.incomings.get(svcId);

      outgoings && extractServiceAndLinks(outgoings);
      incomings && extractServiceAndLinks(incomings);
    });

    allowedLinkIds.forEach((linkId: string) => {
      const link = this.interactions.linksMap.get(linkId);
      if (!link) return;

      links.push(_.cloneDeep(link));
    });

    interactions.setFlows(flows, { sort: true });
    interactions.setLinks(links);

    return new StoreFrame(interactions, services, this.controls);
  }

  clone() {
    return new StoreFrame(
      this.interactions.clone(),
      this.services.clone(),
      this.controls,
    );
  }
}
