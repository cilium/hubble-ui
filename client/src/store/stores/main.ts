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
} from '~/domain/flows';
import {
  InteractionKind,
  Interactions,
  Link,
  Service,
  AccessPoints,
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
    this.setupReactions();
    this.setupDebugTools();
  }

  @action.bound
  setup({ services }: { services: Array<Service> }) {
    this.services.set(services);
  }

  @action.bound
  setNamespaces(nss: Array<string>) {
    this.controls.namespaces = nss;

    if (!this.route.namespace && nss.length > 0) {
      this.controls.setCurrentNamespace(nss[0]);
    }
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

  @action.bound
  applyServiceChange(svc: Service, change: StateChange) {
    // console.log('service change: ', svc, change);

    this.services.applyServiceChange(svc, change);
  }

  @action.bound
  applyServiceLinkChange(link: Link, change: StateChange) {
    // console.log('service link change: ', link, change);

    this.interactions.applyLinkChange(link, change);
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
  private clearMap() {
    this.interactions.clear();
    this.services.clear();
    this.layout.clear();
  }

  @action.bound
  private setupReactions() {
    // initial autoruns fires only once
    autorun(reaction => {
      this.restoreNamespace();
      reaction.dispose();
    });

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
    autorun(reaction => {
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
