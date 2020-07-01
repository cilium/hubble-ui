import {
  action,
  configure,
  observable,
  computed,
  reaction,
  autorun,
} from 'mobx';

import {
  FlowsFilterEntry,
  FlowsFilterKind,
  FlowsFilterDirection,
  Flow,
} from '~/domain/flows';
import {
  InteractionKind,
  Link,
  Service,
  AccessPoints,
  Interactions,
} from '~/domain/service-map';
import { StateChange } from '~/domain/misc';
import { ids } from '~/domain/ids';
import { setupDebugProp } from '~/domain/misc';
import * as storage from '~/storage/local';

import InteractionStore from './interaction';
import LayoutStore from './layout';
import RouteStore, { RouteHistorySourceKind } from './route';
import ServiceStore from './service';
import ControlStore from './controls';
import { HubbleService, HubbleLink, HubbleFlow } from '~/domain/hubble';

configure({ enforceActions: 'observed' });

export interface Props {
  historySource: RouteHistorySourceKind;
}

export class Store {
  @observable interactions: InteractionStore;

  @observable services: ServiceStore;

  @observable route: RouteStore;

  @observable layout: LayoutStore;

  @observable controls: ControlStore;

  constructor({ historySource }: Props) {
    this.interactions = new InteractionStore();
    this.services = new ServiceStore();
    this.controls = new ControlStore();
    this.route = new RouteStore(historySource);

    // LayoutStore is a store which knows geometry props of service map
    // It will be depending on flows / links as these are used to determine
    // positions of cards
    this.layout = new LayoutStore(
      this.services,
      this.interactions,
      this.controls,
    );

    this.restoreNamespace();
    this.restoreVisualFilters();
    this.setupReactions();
    this.setupDebugTools();
  }

  @action.bound
  setup({
    services,
    flows,
    links,
  }: {
    services: HubbleService[];
    flows: HubbleFlow[];
    links: HubbleLink[];
  }) {
    this.services.set(services);
    this.interactions.setLinks(links);
    this.interactions.setFlows(flows);
  }

  @action.bound
  setNamespaces(nss: Array<string>) {
    this.controls.namespaces = nss;

    if (!this.route.namespace && nss.length > 0) {
      this.controls.setCurrentNamespace(nss[0]);
    }
  }

  @action.bound
  applyServiceChange(hubbleService: HubbleService, change: StateChange) {
    // console.log('service change: ', svc, change);

    this.services.applyServiceChange(hubbleService, change);
  }

  @action.bound
  applyServiceLinkChange(hubbleLink: HubbleLink, change: StateChange) {
    // console.log('service link change: ', link, change);

    this.interactions.applyLinkChange(hubbleLink, change);
  }

  @action.bound
  applyNamespaceChange(ns: string, change: StateChange) {
    if (change === StateChange.Deleted) {
      this.controls.removeNamespace(ns);
      return;
    }

    this.controls.addNamespace(ns);
  }

  @computed
  get accessPoints(): AccessPoints {
    const index: AccessPoints = new Map();

    this.interactions.links.forEach((l: Link) => {
      const id = ids.accessPoint(l.destinationId, l.destinationPort);
      if (!index.has(l.destinationId)) {
        index.set(l.destinationId, new Map());
      }

      const serviceAPs = index.get(l.destinationId)!;
      serviceAPs.set(l.destinationPort, {
        id,
        port: l.destinationPort,
        protocol: l.ipProtocol,
        serviceId: l.destinationId,
      });
    });

    return index;
  }

  @computed
  get mocked(): boolean {
    return this.route.hash === 'mock';
  }

  @action.bound
  public clearMap() {
    this.interactions.clear();
    this.services.clear();
    this.layout.clear();
    this.controls.selectTableFlow(null);
  }

  @action.bound
  private setupReactions() {
    // initial autoruns fires only once
    autorun(reaction => {
      this.controls.setVerdict(this.route.verdict);
      reaction.dispose();
    });

    autorun(reaction => {
      this.controls.setHttpStatus(this.route.httpStatus);
      reaction.dispose();
    });

    autorun(reaction => {
      this.setFlowFilters(this.route.flowFilters);
      reaction.dispose();
    });

    // syncing with url
    reaction(
      () => this.controls.currentNamespace,
      namespace => {
        if (!namespace) return;
        storage.saveLastNamespace(namespace);
        this.clearMap();
        this.route.setNamespace(namespace);
      },
    );

    reaction(
      () => this.controls.verdict,
      verdict => {
        this.clearMap();
        this.route.setVerdict(verdict);
      },
    );

    reaction(
      () => this.controls.httpStatus,
      httpStatus => {
        this.clearMap();
        this.route.setHttpStatus(httpStatus);
      },
    );

    reaction(
      () => this.controls.flowFilters,
      filters => this.route.setFlowFilters(filters.map(f => f.toString())),
    );

    // try to update active card flows filter with card caption
    autorun(() => {
      const activeFilter = this.controls.activeCardFilter;
      if (activeFilter == null) {
        this.services.clearActive();
        return;
      }

      if (!activeFilter.isDNS && !activeFilter.isIdentity) return;

      // meta is set already
      if (activeFilter.meta) return;

      // TODO: ensure that query always contains serviceId
      const serviceId = activeFilter.query;
      const card = this.services.byId(serviceId);
      if (card == null) return; // card is not loaded yet

      this.setFlowFilters(this.controls.flowFilters);
      this.services.setActive(serviceId);
    });
  }

  @action.bound
  public toggleActiveService(id: string) {
    return this.services.toggleActive(id);
  }

  @action.bound
  public setFlowFiltersForActiveCard(serviceId: string, isActive: boolean) {
    if (!isActive) {
      return this.setFlowFilters([]);
    }

    // pick first active card
    const card = this.services.byId(serviceId);
    if (card == null) return;

    const filter = new FlowsFilterEntry({
      kind: card.isDNS ? FlowsFilterKind.Dns : FlowsFilterKind.Identity,
      direction: FlowsFilterDirection.Both,
      query: card.id,
      meta: card.isDNS ? undefined : card.caption,
    });

    this.setFlowFilters([filter]);
  }

  @action.bound
  public setFlowFilters(filters: FlowsFilterEntry[]) {
    const nextFilters = filters.map(filter => {
      // prettier-ignore
      const requiresMeta = [
        FlowsFilterKind.Identity,
        FlowsFilterKind.Dns,
      ].includes(filter.kind);

      if (!requiresMeta) return filter;

      // TODO: change search by card `id` to explicit `identity`
      // when `identity` field is available in grpc schema.
      // For now we use identity for `id` - so it works
      const card = this.services.byId(filter.query);
      if (card == null) return filter;

      return filter.clone().setMeta(card.caption);
    });

    this.controls.setFlowFilters(nextFilters);
  }

  @action.bound
  public toggleShowKubeDns(flush = true): boolean {
    const isActive = this.controls.toggleShowKubeDns();
    if (flush) {
      this.clearMap();
    }

    storage.saveShowKubeDns(isActive);
    return isActive;
  }

  @action.bound
  public toggleShowHost(flush = true): boolean {
    const isActive = this.controls.toggleShowHost();
    if (flush) {
      this.clearMap();
    }

    storage.saveShowHost(isActive);
    return isActive;
  }

  // D E B U G
  @action.bound
  public setupDebugTools() {
    setupDebugProp({
      printMapData: () => {
        this.printMapData();
      },
      printLayoutData: () => {
        this.printLayoutData();
      },
    });
  }

  @action.bound
  private restoreNamespace() {
    if (this.route.namespace) {
      this.controls.setCurrentNamespace(this.route.namespace);
      return;
    }

    const lastNamespace = storage.getLastNamespace();
    if (!lastNamespace) return;

    // this.route.goto(`/${lastNamespace}`);
    this.route.setNamespace(lastNamespace);
  }

  @action.bound
  private restoreVisualFilters() {
    this.controls.setShowHost(storage.getShowHost());
    this.controls.setShowKubeDns(storage.getShowKubeDns());
  }

  @action.bound
  private printMapData() {
    const data = {
      services: this.services.cardsList.map(c => c.service),
      links: this.interactions.links,
    };

    console.log(JSON.stringify(data, null, 2));
  }

  @action.bound
  private printLayoutData() {
    const data = this.layout.debugData;

    console.log(JSON.stringify(data, null, 2));
  }
}
