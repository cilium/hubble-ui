import _ from 'lodash';
import { observable, action } from 'mobx';

import InteractionStore from '~/store/stores/interaction';
import LayoutStore from '~/store/stores/layout';
import ServiceStore from '~/store/stores/service';
import ControlStore from '~/store/stores/controls';

import { Filters, filterFlow, filterService } from '~/domain/filtering';
import { Link, Service } from '~/domain/service-map';
import { HubbleService, HubbleLink } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';
import { ServiceCard } from '~/domain/service-card';
import { Flow, FlowsFilterEntry, HubbleFlow, Verdict } from '~/domain/flows';
import { Vec2 } from '~/domain/geometry';

export class StoreFrame {
  @observable
  public controls: ControlStore;

  @observable
  public interactions: InteractionStore;

  @observable
  public services: ServiceStore;

  @observable
  public layout: LayoutStore;

  constructor(
    interactions: InteractionStore,
    services: ServiceStore,
    controls: ControlStore,
  ) {
    this.interactions = interactions;
    this.services = services;
    this.controls = controls;

    this.layout = new LayoutStore(services, interactions, controls);
  }

  getServiceById(id: string) {
    return this.services.byId(id);
  }

  @action.bound
  applyServiceChange(svc: HubbleService, change: StateChange) {
    this.services.applyServiceChange(svc, change);
  }

  @action.bound
  addFlows(flows: HubbleFlow[]) {
    return this.interactions.addFlows(flows);
  }

  @action.bound
  applyServiceLinkChange(link: HubbleLink, change: StateChange) {
    this.interactions.applyLinkChange(link, change);
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
  setHubbleLinks(links: HubbleLink[]) {
    this.interactions.setHubbleLinks(links);
  }

  // @action.bound
  // updateLinkEndpoints(links: HubbleLink[]) {
  //   this.services.updateLinkEndpoints(links);
  // }

  @action.bound
  setAccessPointCoords(apId: string, coords: Vec2) {
    this.layout.setAccessPointCoords(apId, coords);
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

    // const allowedServiceIds: Set<string> = new Set();
    const allowedLinkIds: Set<string> = new Set();

    const extractServiceAndLinks = (obj: Map<string, Map<string, Link>>) => {
      obj?.forEach((accessPointsMap, serviceId: string) => {
        const svc = this.services.cardsMap.get(serviceId);
        if (!svc) return;

        services.addNewCard(svc);

        accessPointsMap.forEach((link: Link, accessPointId: string) => {
          allowedLinkIds.add(link.id);
        });
      });
    };

    // const wasFlows = this.interactions.flows.length;
    this.interactions.flows.forEach((f: Flow) => {
      if (!filterFlow(f, filters)) return;

      flows.push(f.clone());
    });

    const connections = this.interactions.connections;
    this.services.cardsList.forEach((card: ServiceCard) => {
      if (!filterService(card.service, filters)) return;

      // NOTE: card.id might be not simple identity (number)
      services.addNewCard(card.clone());

      if (this.services.isCardActive(card.id)) {
        services.setActive(card.id);
      }

      const outgoings = connections.outgoings.get(card.id);
      const incomings = connections.incomings.get(card.id);

      outgoings && extractServiceAndLinks(outgoings);
      incomings && extractServiceAndLinks(incomings);
    });

    allowedLinkIds.forEach((linkId: string) => {
      const link = this.interactions.linksMap.get(linkId);
      if (!link) return;

      links.push(_.cloneDeep(link));
    });

    interactions.setFlows(flows);
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
