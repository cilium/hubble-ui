import { trace, action, autorun, configure, observable, computed } from 'mobx';

import { Flow } from '~/domain/flows';
import {
  InteractionKind,
  Interactions,
  Link,
  Service,
} from '~/domain/service-map';

import InteractionStore from './interaction';
import LayoutStore from './layout';
import RouteStore from './route';
import ServiceStore from './service';

configure({ enforceActions: 'observed' });

export class Store {
  @observable interactions: InteractionStore;

  @observable services: ServiceStore;

  @observable route: RouteStore;

  @observable layout: LayoutStore;

  // TODO: consider namespace things to move to separate store (ex: MapStore)

  @observable namespaces: Array<string> = [];

  @observable currentNsIdx = -1;

  @observable selectedTableFlow: Flow | null = null;

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

  @computed get currentNamespace(): string | undefined {
    return this.namespaces[this.currentNsIdx];
  }

  @action.bound
  setup({ services }: { services: Array<Service> }) {
    this.services.set(services);
  }

  @action.bound
  setNamespaces(nss: Array<string>, activateFirst?: boolean) {
    this.namespaces = nss;

    if (!!activateFirst && nss.length > 0) {
      this.currentNsIdx = 0;
    }
  }

  @action.bound
  setNamespaceByName(ns: string) {
    const idx = this.namespaces.findIndex(n => n === ns);
    this.currentNsIdx = idx;
  }

  @action.bound
  selectTableFlow(flow: Flow | null) {
    this.selectedTableFlow = flow;
  }

  @action.bound
  updateInteractions<T = {}>(
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
