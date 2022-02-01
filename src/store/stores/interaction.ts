import _ from 'lodash';
import { makeAutoObservable } from 'mobx';

import { Flow, HubbleFlow } from '~/domain/flows';
import { Link } from '~/domain/service-map';
import { HubbleLink } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';
import { flowFromRelay } from '~/domain/helpers';
import { LinkConnections } from '~/domain/interactions/connections';
import {
  GroupedPartialConnections,
  L7Endpoint,
} from '~/domain/interactions/new-connections';

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

  private _flows: Array<Flow>;
  private _links: Array<Link>;

  // NOTE: { serviceId -> { port -> { l7kind -> { epId -> L7Endpoint }}}}
  public l7endpoints: GroupedPartialConnections<L7Endpoint>;

  constructor() {
    this._flows = [];
    this._links = [];
    this.l7endpoints = new GroupedPartialConnections();

    makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  get flows() {
    return this._flows.slice();
  }

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

  clear() {
    this.clearFlows();
    this.clearLinks();
  }

  clearFlows() {
    this._flows = [];
  }

  clearLinks() {
    this._links = [];
  }

  addHubbleLinks(hubbleLinks: HubbleLink[]) {
    hubbleLinks.forEach(this.addLink);
  }

  setLinks(links: Link[]) {
    this._links = links;
  }

  setHubbleFlows(hubbleFlows: HubbleFlow[], opts?: SetOptions) {
    const flows = hubbleFlows.map(flowFromRelay);
    return this.setFlows(flows, opts);
  }

  setFlows(flows: Flow[], opts?: SetOptions) {
    if (!opts?.sort) {
      this._flows = flows;
      return;
    }

    this._flows = flows.slice().sort((a, b) => {
      return b.millisecondsTimestamp! - a.millisecondsTimestamp!;
    });
  }

  public addFlows(flows: Flow[]) {
    this._flows = _(flows)
      .concat(this._flows)
      .uniqBy(f => f.id)
      .sort((a, b) => b.millisecondsTimestamp! - a.millisecondsTimestamp!)
      .slice(0, InteractionStore.FLOWS_MAX_COUNT)
      .value();

    this.extractL7Info(flows);

    return {
      flowsTotalCount: this._flows.length,
      flowsDiffCount: flows.length,
    };
  }

  public addLinks(links: Link[]) {
    links.forEach(link => {
      this.addLink(link.hubbleLink);
    });
  }

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

  public addNewLink(link: Link): boolean {
    const existing = this.linksMap.get(link.id);
    if (existing != null) return false;

    this._links.push(link);
    return true;
  }

  public extractL7Info(flows: Flow[]) {
    flows.forEach(flow => {
      if (flow.l7Wrapped == null || flow.destinationPort == null) return;

      const ep = new L7Endpoint(flow.l7Wrapped);

      this.l7endpoints.upsert(
        flow.destinationServiceId,
        `${flow.destinationPort}`,
        flow.l7Wrapped.kind,
        ep.id,
        ep,
      );
    });
  }

  private addLink(hubbleLink: HubbleLink) {
    if (this.linksMap.has(hubbleLink.id)) return this.updateLink(hubbleLink);

    this._links.push(Link.fromHubbleLink(hubbleLink));
  }

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

  private updateLink(hubbleLink: HubbleLink) {
    if (!this.linksMap.has(hubbleLink.id)) return;

    const idx = this._links.findIndex(l => l.id === hubbleLink.id);
    if (idx === -1) return;

    const currentLink = this._links[idx];
    const updatedLink = currentLink.updateWithHubbleLink(hubbleLink);

    this._links.splice(idx, 1, updatedLink);
  }

  get connections(): LinkConnections {
    return LinkConnections.buildFromLinks(this._links);
  }

  get all() {
    return {
      links: this._links,
    };
  }

  get linksMap(): Map<string, Link> {
    const index = new Map();

    this._links.forEach((l: Link) => {
      index.set(l.id, l);
    });

    return index;
  }
}
