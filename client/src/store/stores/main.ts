import { autorun, observable } from 'mobx';
import { IFlow } from '~/domain/flows';
import { Service } from '~/domain/service-map';
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

  // TODO: consider namespace things to move to separate store
  @observable
  public namespaces: Array<string> = [];

  @observable
  public currentNsIdx = -1;

  @observable
  public layout: LayoutStore;

  constructor() {
    this.interactions = new InteractionStore();
    this.services = new ServiceStore();
    this.route = new RouteStore();

    // LayoutStore is a store which knows geometry props of service map
    // It will be depending on flows / links as these are used to determine
    // positions of cards
    this.layout = new LayoutStore(this.services /* this.flows */);

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
}
