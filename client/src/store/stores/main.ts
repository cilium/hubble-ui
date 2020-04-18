import { observable, autorun, reaction } from 'mobx';

import { Service, Link } from '~/domain/service-map';

import InteractionStore from './interaction';
import ServiceStore from './service';
import RouteStore from './route';
import LayoutStore from './layout';

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
  }

  static new(): Store {
    return new Store();
  }

  public setup(services: Array<Service>) {
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
