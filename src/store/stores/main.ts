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

import { Service } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';
import { setupDebugProp } from '~/domain/misc';
import { Vec2 } from '~/domain/geometry';
import { HubbleService, HubbleLink, HubbleFlow } from '~/domain/hubble';

import InteractionStore from './interaction';
import RouteStore, { RouteHistorySourceKind, Route } from './route';
import ServiceStore from './service';
import ControlStore from './controls';

import { StoreFrame } from '~/store/frame';
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
  private _frames: StoreFrame[];

  constructor(props: Props) {
    this.controls = new ControlStore();
    this.route = new RouteStore(props.historySource, props.routes);

    this._frames = [];

    this.createMainFrame();
    this.setupReactions();
    this.restoreNamespace();
    this.restoreVisualFilters();
    this.setupDebugTools();
  }

  @computed get frames() {
    return this._frames.slice();
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
  createMainFrame() {
    const frame = this.createFrame();

    // Ensure frame to be the first in frames array
    if (this._frames.length === 0) {
      this._frames.push(frame);
    } else {
      this._frames.unshift(frame);
    }

    return frame;
  }

  @action.bound
  setNamespaces(nss: Array<string>) {
    this.controls.namespaces = nss;

    if (!this.route.namespace && nss.length > 0) {
      this.controls.setCurrentNamespace(nss[0]);
    }
  }

  createFrame(): StoreFrame {
    const interactions = new InteractionStore();
    const services = new ServiceStore();

    const frame = new StoreFrame(interactions, services, this.controls);
    return frame;
  }

  deriveFrame(): StoreFrame {
    return this.mainFrame.clone();
  }

  @action.bound
  squashFrames() {
    if (this._frames.length <= 1) return;

    const squashed = this.mainFrame.cloneEmpty();
    this._frames.forEach(f => {
      squashed.applyFrame(f, this.controls.filters);
    });

    this._frames = [squashed];
  }

  @action.bound
  pushFrame(frame: StoreFrame): number {
    return this._frames.push(frame);
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
    const res = this.mainFrame.addFlows(flows);
    if (this.currentFrame == this.mainFrame) {
      return res;
    }

    return this.currentFrame.addFlows(flows);
  }

  @computed
  get mocked(): boolean {
    return this.route.hash === 'mock';
  }

  @action.bound
  public flush() {
    this._frames = [];
    this.controls.selectTableFlow(null);
    this.createMainFrame();
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
        storage.saveLastNamespace(namespace);
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
    // pick first active card
    const card = this.currentFrame.services.byId(serviceId);
    if (card == null) return;

    let kind = FlowsFilterKind.Identity;
    let query = card.id;

    if (card.isDNS) {
      kind = FlowsFilterKind.Dns;
      query = card.caption;
    } else if (card.isWorld) {
      kind = FlowsFilterKind.Label;
      query = ReservedLabel.World;
    }

    const filter = new FlowsFilterEntry({
      kind,
      query,
      direction: FlowsFilterDirection.Both,
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
    if (this.route.namespace) {
      this.controls.setCurrentNamespace(this.route.namespace);
      return;
    }

    const lastNamespace = storage.getLastNamespace();
    if (!lastNamespace) return;

    this.controls.setCurrentNamespace(lastNamespace);
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
      cardsBBoxes: this.currentFrame.placement.cardsBBoxes,
      accessPointCoords: this.currentFrame.placement.accessPointCoords,
      arrows: this.currentFrame.arrows.arrowsMap,
      connections: this.currentFrame.interactions.connections,
    };

    console.log(JSON.stringify(data, null, 2));
    console.log(data);
  }

  @computed
  get mainFrame(): StoreFrame {
    if (this._frames.length === 0) throw new Error('main frame is undefined');

    return this._frames[0];
  }

  @computed
  get currentFrame(): StoreFrame {
    return this._frames[this._frames.length - 1];
  }
}
