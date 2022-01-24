import _ from 'lodash';
import { action, observable, computed, makeAutoObservable } from 'mobx';

import { Flow, HubbleFlow } from '~/domain/flows';
import { Link, ServiceCard, AccessPoint } from '~/domain/service-map';
import { ids } from '~/domain/ids';
import { HubbleLink } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';
import { flowFromRelay } from '~/domain/helpers';
import { Connections } from '~/domain/interactions/connections';

export interface CopyResult {
  newFlows: number;
  newLinks: number;
}

export interface SetOptions {
  sort?: boolean;
}

// This store maintains ANY interactions that may present on the map
export default class InteractionStore {
  public static readonly FLOWS_MAX_COUNT = 100000;

  @observable private _flows: Array<Flow>;
  @observable private _links: Array<Link>;

  constructor() {
    this._flows = [];
    this._links = [];

    makeAutoObservable(this);
  }

  @computed
  get flows() {
    return this._flows.slice();
  }

  @computed
  get links() {
    return this._links.slice();
  }

  // TODO: be careful with shallow cloning
  clone(deep = false): InteractionStore {
    const store = new InteractionStore();

    store._flows = deep ? _.cloneDeep(this._flows) : this._flows.slice();
    store._links = deep ? _.cloneDeep(this._links) : this._links.slice();

    return store;
  }

  @action.bound
  clear() {
    this.clearFlows();
    this.clearLinks();
  }

  @action.bound
  clearFlows() {
    this._flows = [];
  }

  @action.bound
  clearLinks() {
    this._links = [];
  }

  @action.bound
  addHubbleLinks(hubbleLinks: HubbleLink[]) {
    hubbleLinks.forEach(this.addLink);
  }

  @action.bound
  setLinks(links: Link[]) {
    this._links = links;
  }

  @action.bound
  setHubbleFlows(hubbleFlows: HubbleFlow[], opts?: SetOptions) {
    const flows = hubbleFlows.map(flowFromRelay);
    return this.setFlows(flows, opts);
  }

  @action.bound
  setFlows(flows: Flow[], opts?: SetOptions) {
    if (!opts?.sort) {
      this._flows = flows;
      return;
    }

    this._flows = flows.slice().sort((a, b) => {
      return b.millisecondsTimestamp! - a.millisecondsTimestamp!;
    });
  }

  @action.bound
  public addFlows(flows: Flow[]) {
    this._flows = _(flows)
      .concat(this._flows)
      .uniqBy(f => f.id)
      .sort((a, b) => b.millisecondsTimestamp! - a.millisecondsTimestamp!)
      .slice(0, InteractionStore.FLOWS_MAX_COUNT)
      .value();

    return {
      flowsTotalCount: this._flows.length,
      flowsDiffCount: flows.length,
    };
  }

  @action.bound
  public addLinks(links: Link[]) {
    links.forEach(link => {
      this.addLink(link.hubbleLink);
    });
  }

  @action.bound
  applyLinkChange(hubbleLink: HubbleLink, change: StateChange) {
    switch (change) {
      case StateChange.Deleted: {
        return this.deleteLink(hubbleLink);
      }
      // TODO: handle all cases properly
      case StateChange.Added:
      case StateChange.Modified:
      case StateChange.Exists: {
        return this.addLink(hubbleLink);
      }
    }
  }

  @action.bound
  moveTo(rhs: InteractionStore): CopyResult {
    const wasNFlows = rhs._flows.length;
    const { flowsTotalCount } = rhs.addFlows(this._flows);

    let newLinks = 0;
    this._links.forEach((link: Link) => {
      const added = rhs.addNewLink(link);
      newLinks += Number(added);
    });

    return {
      newFlows: wasNFlows - flowsTotalCount,
      newLinks,
    };
  }

  @action.bound
  addNewLink(link: Link): boolean {
    const existing = this.linksMap.get(link.id);
    if (existing != null) return false;

    this._links.push(link);
    return true;
  }

  @action.bound
  private addLink(hubbleLink: HubbleLink) {
    if (this.linksMap.has(hubbleLink.id)) return this.updateLink(hubbleLink);

    this._links.push(Link.fromHubbleLink(hubbleLink));
  }

  @action.bound
  private deleteLink(hubbleLink: HubbleLink) {
    if (!this.linksMap.has(hubbleLink.id)) return;

    const idx = this._links.findIndex(l => l.id === hubbleLink.id);
    if (idx === -1) return;

    const currentHubbleLink = this._links[idx];
    if (currentHubbleLink.verdicts.size > 1) {
      currentHubbleLink.verdicts.delete(hubbleLink.verdict);
      return;
    }

    this._links.splice(idx, 1);
  }

  @action.bound
  private updateLink(hubbleLink: HubbleLink) {
    if (!this.linksMap.has(hubbleLink.id)) return;

    const idx = this._links.findIndex(l => l.id === hubbleLink.id);
    if (idx === -1) return;

    const currentLink = this._links[idx];
    const updatedLink = currentLink.updateWithHubbleLink(hubbleLink);

    this._links.splice(idx, 1, updatedLink);
  }

  @computed
  get connections(): Connections {
    return Connections.build(this._links);
  }

  @computed get all() {
    return {
      links: this._links,
    };
  }

  @computed get linksMap(): Map<string, Link> {
    const index = new Map();

    this._links.forEach((l: Link) => {
      index.set(l.id, l);
    });

    return index;
  }
}
