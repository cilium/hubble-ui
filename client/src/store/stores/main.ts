import { observable, autorun, reaction } from 'mobx';

import {
  Service,
  Link,
  Interactions,
  InteractionKind,
} from '~/domain/service-map';
import { IFlow } from '~/domain/flows';

import InteractionStore from './interaction';
import LayoutStore from './layout';
import RouteStore from './route';
import ServiceStore from './service';

export class Store {
  @observable
  public interactions: InteractionStore;

  @observable
  public services: ServiceStore;

  @observable
  public route: RouteStore;

  @observable
  public layout: LayoutStore;

  // TODO: consider namespace things to move to separate store (ex: MapStore)
  @observable
  public namespaces: Array<string> = [];

  @observable
  public currentNsIdx = -1;

  constructor() {
    this.interactions = new InteractionStore();
    this.services = new ServiceStore();
    this.route = new RouteStore();

    // LayoutStore is a store which knows geometry props of service map
    // It will be depending on flows / links as these are used to determine
    // positions of cards
    this.layout = new LayoutStore(this.services, this.interactions);

    autorun(() => {
      const ns = this.route.pathParts[0];

      this.setNamespaceByName(ns);
    });
  }

  static new(): Store {
    return new Store();
  }

  public setup({
    flows,
    services,
  }: {
    flows: Array<IFlow>;
    services: Array<Service>;
  }) {
    this.interactions.setFlows(flows);
    this.services.set(services);
  }

  public get currentNamespace(): string | undefined {
    return this.namespaces[this.currentNsIdx];
  }

  public setNamespaces(nss: Array<string>, activateFirst?: boolean) {
    this.namespaces = nss;

    if (!!activateFirst && nss.length > 0) {
      this.currentNsIdx = 0;
    }
  }

  public setNamespaceByName(ns: string) {
    const idx = this.namespaces.findIndex(n => n === ns);
    this.currentNsIdx = idx;
  }

  public updateInteractions<T = {}>(
    interactions: Interactions<T>,
    handleInteractions?: (kind: string, interactions: any) => void,
  ) {
    // TODO: in fact it should accurately apply a diff with current interactions

    Object.keys(interactions).forEach((k: string) => {
      const key = k as keyof Interactions<T>;

      if (key === InteractionKind.Links) {
        const links = (interactions.links || []) as Array<Link>;

        this.services.updateLinkEndpoints(links);
        this.interactions.setLinks(links);
      } else if (key === InteractionKind.Flows) {
        return;
      } else if (handleInteractions != null) {
        handleInteractions(k, interactions[key]);
      }
    });
  }
}
