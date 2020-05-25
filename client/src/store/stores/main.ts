import { action, configure, observable } from 'mobx';
import { Flow } from '~/domain/flows';
import {
  InteractionKind,
  Interactions,
  Link,
  Service,
} from '~/domain/service-map';
import InteractionStore from './interaction';
import LayoutStore from './layout';
import RouteStore, { RouteHistorySourceKind } from './route';
import ServiceStore from './service';

configure({ enforceActions: 'observed' });

export interface Props {
  historySource: RouteHistorySourceKind;
}

export class Store {
  @observable interactions: InteractionStore;

  @observable services: ServiceStore;

  @observable route: RouteStore;

  @observable layout: LayoutStore;

  @observable namespaces: Array<string> = [];

  @observable selectedTableFlow: Flow | null = null;

  constructor({ historySource }: Props) {
    this.interactions = new InteractionStore();
    this.services = new ServiceStore();
    this.route = new RouteStore(historySource);

    // LayoutStore is a store which knows geometry props of service map
    // It will be depending on flows / links as these are used to determine
    // positions of cards
    this.layout = new LayoutStore(this.services, this.interactions);
  }

  @action.bound
  setup({ services }: { services: Array<Service> }) {
    this.services.set(services);
  }

  @action.bound
  setNamespaces(nss: Array<string>) {
    this.namespaces = nss;

    if (!this.route.namespace && nss.length > 0) {
      this.route.navigate(`/${nss[0]}`);
    }
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
