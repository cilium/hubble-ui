import {
  action,
  configure,
  observable,
  computed,
  reaction,
  autorun,
} from 'mobx';

import { Flow } from '~/domain/flows';
import {
  Filters,
  FilterEntry,
  FilterKind,
  FilterDirection,
} from '~/domain/filtering';

import { Service } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';
import { setupDebugProp } from '~/domain/misc';
import { Vec2 } from '~/domain/geometry';
import { HubbleService, HubbleLink, HubbleFlow } from '~/domain/hubble';

import {
  ServiceMapPlacementStrategy,
  ServiceMapArrowStrategy,
} from '~/domain/layout/service-map';

import InteractionStore from './interaction';
import RouteStore, { RouteHistorySourceKind, Route } from './route';
import ServiceStore from './service';
import ControlStore from './controls';

import { StoreFrame, EventKind as FrameEvent } from '~/store/frame';
import * as storage from '~/storage/local';
import { ReservedLabel } from '~/domain/labels';

configure({ enforceActions: 'observed' });

export interface Props {
  historySource: RouteHistorySourceKind;
  routes?: Route[];
}

export class Store {
  @observable
  public route: RouteStore;

  @observable
  public controls: ControlStore;

  @observable
  public placement: ServiceMapPlacementStrategy;

  @observable
  public arrows: ServiceMapArrowStrategy;

  @observable
  public globalFrame: StoreFrame;

  @observable
  public currentFrame: StoreFrame;

  constructor(props: Props) {
    this.controls = new ControlStore();
    this.route = new RouteStore(props.historySource, props.routes);

    this.globalFrame = StoreFrame.empty();
    this.currentFrame = StoreFrame.empty();

    this.placement = new ServiceMapPlacementStrategy(
      this.controls,
      this.currentFrame.interactions,
      this.currentFrame.services,
    );

    this.arrows = new ServiceMapArrowStrategy(
      this.controls,
      this.currentFrame.interactions,
      this.currentFrame.services,
      this.placement,
    );

    this.restoreNamespace();
    this.restoreVisualFilters();

    // NOTE: main frame should be initialized with all filters set up
    // this.createMainFrame();
    this.setupEventHandlers();
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
    this.currentFrame.services.set(services);
    this.currentFrame.services.extractAccessPoints(links);
    this.currentFrame.interactions.addHubbleLinks(links);
    this.currentFrame.interactions.setHubbleFlows(flows, { sort: true });
  }

  @action.bound
  setNamespaces(nss: Array<string>) {
    this.controls.namespaces = nss;

    if (!this.route.namespace && nss.length > 0) {
      this.controls.setCurrentNamespace(nss[0]);
    }
  }

  @action.bound
  resetCurrentFrame(filters: Filters) {
    this.currentFrame.flush();
    this.placement.reset();
    this.currentFrame.applyFrame(this.globalFrame, filters);
  }

  @action.bound
  applyServiceChange(svc: Service, change: StateChange) {
    // console.log('service change: ', svc, change);

    this.currentFrame.applyServiceChange(svc, change);
  }

  @action.bound
  applyServiceLinkChange(hubbleLink: HubbleLink, change: StateChange) {
    // console.log('service link change: ', link, change);

    this.currentFrame.applyServiceLinkChange(hubbleLink, change);
  }

  @action.bound
  applyNamespaceChange(ns: string, change: StateChange) {
    if (change === StateChange.Deleted) {
      this.controls.removeNamespace(ns);
      return;
    }

    this.controls.addNamespace(ns);
  }

  @action.bound
  addFlows(flows: Flow[]) {
    return this.currentFrame.addFlows(flows);
  }

  @computed
  get mocked(): boolean {
    return this.route.hash === 'mock';
  }

  @action.bound
  public flush() {
    this.controls.selectTableFlow(null);

    this.globalFrame.flush();
    this.currentFrame.flush();
  }

  @action.bound
  private setupEventHandlers() {
    const wrongChanges = [StateChange.Unknown, StateChange.Deleted];

    this.currentFrame.on(FrameEvent.ServicesSet, svcs => {
      this.globalFrame.setServices(svcs);
    });

    this.currentFrame.on(FrameEvent.FlowsAdded, flows => {
      this.globalFrame.addFlows(flows);
    });

    this.currentFrame.on(FrameEvent.LinkChanged, (link, change) => {
      if (wrongChanges.includes(change)) return;

      this.globalFrame.applyServiceLinkChange(link, change);
    });

    this.currentFrame.on(FrameEvent.ServiceChange, (svc, change) => {
      if (wrongChanges.includes(change)) return;

      this.globalFrame.applyServiceChange(svc, change);
    });
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

    reaction(
      () => this.controls.currentNamespace,
      namespace => {
        if (!namespace) return;
        this.route.setNamespace(namespace);
      },
    );

    reaction(
      () => this.controls.verdict,
      verdict => {
        this.route.setVerdict(verdict);
      },
    );

    reaction(
      () => this.controls.httpStatus,
      httpStatus => {
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
        this.currentFrame.services.clearActive();
        return;
      }

      if (!activeFilter.isDNS && !activeFilter.isIdentity) return;

      // meta is set already
      if (activeFilter.meta) return;

      // TODO: ensure that query always contains serviceId
      const serviceId = activeFilter.query;
      const card = this.currentFrame.getServiceById(serviceId);
      if (card == null) return; // card is not loaded yet

      this.setFlowFilters(this.controls.flowFilters);
      this.currentFrame.setActiveService(serviceId);
    });
  }

  @action.bound
  public toggleActiveService(id: string) {
    return this.currentFrame.toggleActiveService(id);
  }

  @action.bound
  public setFlowFiltersForActiveCard(serviceId: string, isActive: boolean) {
    if (!isActive) {
      return this.setFlowFilters([]);
    }

    const card = this.currentFrame.services.byId(serviceId);
    if (card == null) return;

    this.setFlowFilters([card.filterEntry]);
  }

  @action.bound
  public setFlowFilters(filters: FilterEntry[]) {
    const nextFilters = filters.map(filter => {
      // prettier-ignore
      const requiresMeta = [
        FilterKind.Identity,
        FilterKind.Dns,
      ].includes(filter.kind);

      if (!requiresMeta) return filter;

      // TODO: change search by card `id` to explicit `identity`
      // when `identity` field is available in grpc schema.
      // For now we use identity for `id` - so it works
      const card = this.currentFrame.services.byId(filter.query);
      if (card == null) return filter;

      return filter.clone().setMeta(card.caption);
    });

    this.controls.setFlowFilters(nextFilters);
  }

  @action.bound
  public toggleShowKubeDns(): boolean {
    const isActive = this.controls.toggleShowKubeDns();

    storage.saveShowKubeDns(isActive);
    return isActive;
  }

  @action.bound
  public toggleShowHost(): boolean {
    const isActive = this.controls.toggleShowHost();

    storage.saveShowHost(isActive);
    return isActive;
  }

  @action.bound
  public toggleShowRemoteNode(): boolean {
    const isActive = this.controls.toggleShowRemoteNode();

    storage.saveShowRemoteNode(isActive);
    return isActive;
  }

  @action.bound
  public toggleShowPrometheusApp(): boolean {
    const isActive = this.controls.toggleShowPrometheusApp();

    storage.saveShowPrometheusApp(isActive);
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
    if (!this.route.namespace) return;

    this.controls.setCurrentNamespace(this.route.namespace);
  }

  @action.bound
  private restoreVisualFilters() {
    this.controls.setShowHost(storage.getShowHost());
    this.controls.setShowKubeDns(storage.getShowKubeDns());
  }

  @action.bound
  private printMapData() {
    const data = {
      services: this.currentFrame.services.cardsList.map(c => c.service),
      links: this.currentFrame.interactions.links.map(l => l.hubbleLink),
    };

    console.log(JSON.stringify(data, null, 2));
  }

  @action.bound
  private printLayoutData() {
    const data = {
      cardsBBoxes: this.placement.cardsBBoxes,
      accessPointCoords: this.placement.accessPointCoords,
      arrows: this.arrows.arrowsMap,
      connections: this.currentFrame.interactions.connections,
    };

    console.log(JSON.stringify(data, null, 2));
    console.log(data);
  }
}
