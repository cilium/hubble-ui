import { observable, autorun, reaction } from 'mobx';

import { Flow } from '~/domain/data';
import { IEndpoint } from '~/domain/mocked-data';

import FlowsStore from './flows';
import EndpointsStore from './endpoints';
import RouteStore from './route';
import LayoutStore from './layout';

export class Store {
  @observable
  public flows: FlowsStore;

  @observable
  public endpoints: EndpointsStore;

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
    this.flows = new FlowsStore();
    this.endpoints = new EndpointsStore();
    this.route = new RouteStore();

    // LayoutStore is a store which knows geometry props of service map
    // It will be depending on flows / links as these are used to determine
    // positions of cards
    this.layout = new LayoutStore(this.endpoints /* this.flows */);
  }

  static new(): Store {
    return new Store();
  }

  public setup(flows: Array<Flow>, endpoints: Array<IEndpoint>) {
    this.flows.set(flows);
    this.endpoints.set(endpoints);
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
