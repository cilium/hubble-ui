import _ from 'lodash';
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
  InteractionKind,
  Interactions,
  Link,
  Service,
  AccessPoints,
} from '~/domain/service-map';

import { StateChange } from '~/domain/misc';

import InteractionStore from './interaction';
import LayoutStore from './layout';
import RouteStore, { RouteHistorySourceKind } from './route';
import ServiceStore from './service';
import ControlStore from './controls';

import { ids } from '~/domain/ids';
import { setupDebugProp } from '~/domain/misc';
import * as storage from '~/storage/local';

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

  private clearMap() {
    this.interactions.clear();
    this.services.clear();
    this.layout.clear();
  }

  private setupReactions() {
    // prettier-ignore
    reaction(() => this.controls.currentNamespace, namespace => {
      if (!namespace) return;
      storage.saveLastNamespace(namespace);

      this.clearMap();
      this.route.setNamespace(namespace);
    });

    reaction(
      () => this.controls.verdict,
      () => {
        this.clearMap();
      },
    );

    reaction(
      () => this.controls.httpStatus,
      () => {
        this.clearMap();
      },
    );

    reaction(
      () => this.controls.flowFilters,
      () => {
        this.clearMap();
      },
    );

    // Initialization from route to store
    // prettier-ignore
    autorun(r => {
      this.restoreNamespace();
      r.dispose();
    });

    // prettier-ignore
    autorun(r => {
      this.controls.setVerdict(this.route.verdict);
      r.dispose();
    });

    // prettier-ignore
    autorun(r => {
      this.controls.setHttpStatus(this.route.httpStatus);
      r.dispose();
    });

    autorun(r => {
      this.controls.setFlowFilters(this.route.flowFilters);
      r.dispose();
    });

    // Normal reactions, from store to route
    reaction(
      () => this.controls.verdict,
      v => {
        this.route.setVerdict(v);
      },
    );

    reaction(
      () => this.controls.httpStatus,
      st => {
        this.route.setHttpStatus(st);
      },
    );

    reaction(
      () => this.controls.flowFilters,
      st => {
        const ffs = _.invokeMap(this.controls.flowFilters, 'toString');
        this.route.setFlowFilters(ffs);
      },
    );
  }

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

  // D E B U G
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

  public printMapData() {
    const data = {
      services: this.services.cards.map(c => c.service),
      links: this.interactions.links,
    };

    console.log(JSON.stringify(data, null, 2));
  }

  public printLayoutData() {
    const data = this.layout.debugData;

    console.log(JSON.stringify(data, null, 2));
  }
}
