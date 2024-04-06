import _ from 'lodash';
import { makeAutoObservable } from 'mobx';

import { Flow, HubbleFlow } from '~/domain/flows';
import { Link } from '~/domain/service-map';
import { HubbleLink, L7Kind, Verdict } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';
import { LinkConnections } from '~/domain/interactions/connections';
import { Method as HttpMethod } from '~/domain/http';
import { GroupedPartialConnections, L7Endpoint } from '~/domain/interactions/new-connections';

export interface CopyResult {
  newFlows: number;
  newLinks: number;
}

export interface SetOptions {
  sort?: boolean;
}

// This store maintains ANY interactions that may present on the map
export class InteractionStore {
  public static readonly FLOWS_MAX_COUNT = 1024;

  private _flows: Flow[];
  private _links: Link[];

  // NOTE: { serviceId -> { port -> { l7kind -> { epId -> L7Endpoint }}}}
  public l7endpoints: GroupedPartialConnections<L7Endpoint>;

  private flowsInfo: {
    lastTime: number;
    flowsCnt: number;
    tmpFlowsCnt: number;
    checkCnt: 0;
  };

  constructor() {
    this._flows = [];
    this._links = [];
    this.l7endpoints = new GroupedPartialConnections();

    this.flowsInfo = {
      lastTime: Date.now(),
      flowsCnt: 0,
      tmpFlowsCnt: 0,
      checkCnt: 0,
    };

    makeAutoObservable(this);
  }

  get flows() {
    return this._flows.slice();
  }

  get flowsMap(): Map<string, Flow> {
    const m = new Map();

    this._flows.forEach(f => {
      m.set(f.id, f);
    });

    return m;
  }

  get links() {
    return this._links.slice();
  }

  public get oldestFlow(): Flow | null {
    const f = this._flows;

    return f.length === 0 ? null : f[f.length - 1];
  }

  // TODO: be careful with shallow cloning
  clone(deep = false): InteractionStore {
    const store = new InteractionStore();

    store._flows = deep ? _.cloneDeep(this._flows) : this._flows.slice();
    store._links = deep ? _.cloneDeep(this._links) : this._links.slice();
    store.l7endpoints = deep ? _.cloneDeep(this.l7endpoints) : this.l7endpoints;

    return store;
  }

  clear() {
    this.clearFlows();
    this.clearLinks();

    this.l7endpoints.clear();
  }

  clearFlows() {
    this._flows.splice(0, this._flows.length);
  }

  clearLinks() {
    this._links.splice(0, this._links.length);
  }

  addHubbleLinks(hubbleLinks: HubbleLink[]) {
    hubbleLinks.forEach(this.addLink);
  }

  setLinks(links: Link[]) {
    this._links = links;
  }

  setHubbleFlows(hubbleFlows: HubbleFlow[], opts?: SetOptions) {
    const flows = hubbleFlows.map(hf => new Flow(hf));
    return this.setFlows(flows, opts);
  }

  setFlows(flows: Flow[], opts?: SetOptions) {
    if (!opts?.sort) {
      this._flows = flows;
      return;
    }

    this._flows = flows.slice().sort((a, b) => b.compare(a));
  }

  public addFlows(newFlows: Flow[], sortDesc = true) {
    // Append new flows by mutating current array
    // const flowsMaxCount = Math.min(
    //   InteractionStore.FLOWS_MAX_COUNT,
    //   newFlows.length,
    // );

    // for (let i = 0; i < flowsMaxCount; i += 1) {
    //   const shiftI = i + flowsMaxCount;
    //   if (this._flows[i] && shiftI < InteractionStore.FLOWS_MAX_COUNT) {
    //     if (shiftI < this._flows.length) {
    //       this._flows[shiftI] = this._flows[i];
    //     } else {
    //       this._flows.push(this._flows[i]);
    //     }
    //   }
    //   this._flows[i] = newFlows[i];
    // }
    const sortFn = sortDesc
      ? (a: Flow, b: Flow) => b.compare(a)
      : (a: Flow, b: Flow) => a.compare(b);

    this._flows = _(newFlows)
      .concat(this._flows)
      .uniqBy(f => f.id)
      .sort(sortFn)
      .slice(0, InteractionStore.FLOWS_MAX_COUNT)
      .value();

    this.extractL7Info(newFlows);

    this.flowsInfo.tmpFlowsCnt += newFlows.length;

    const now = Date.now();
    const timeDiff = now - this.flowsInfo.lastTime;
    if (timeDiff >= 1000) {
      const flowsDiff = this.flowsInfo.tmpFlowsCnt - this.flowsInfo.flowsCnt;

      this.flowsInfo.lastTime = now;
      this.flowsInfo.flowsCnt = this.flowsInfo.tmpFlowsCnt;

      const avgFlows = Math.round(this.flowsInfo.flowsCnt / ++this.flowsInfo.checkCnt);

      // console.log(
      //   `${flowsDiff} new flows in ${timeDiff}ms (avg ${avgFlows} flows/sec) | buffered ${this._flows.length} flows`,
      // );

      if (avgFlows > 500) {
        console.warn(`avg flows ingestion is ${avgFlows}/sec. ui may be unresponsive`);
      }
    }

    return {
      flowsTotalCount: this._flows.length,
      flowsDiffCount: newFlows.length,
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
        return this.upsertHubbleLink(hubbleLink);
      case StateChange.Exists: {
        return this.upsertHubbleLink(hubbleLink);
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
      ep.addVerdict(flow.verdict);

      this.l7endpoints.upsert(
        flow.destinationServiceId,
        `${flow.destinationPort}`,
        flow.l7Wrapped.kind,
        ep.id,
        ep,
      );
    });
  }

  public getHttpEndpointByParts(
    receiverId: string,
    port: number | string,
    method: HttpMethod,
    urlPathname: string,
  ): L7Endpoint | undefined {
    const endpointsMap = this.l7endpoints.get(receiverId)?.get(port.toString())?.get(L7Kind.HTTP);

    if (endpointsMap == null) return void 0;
    const epId = L7Endpoint.generateId(method, urlPathname);

    return endpointsMap.get(epId);
  }

  public getHttpVerdicts(
    receiverId: string,
    port: number | string,
    method: HttpMethod,
    urlPathname: string,
  ): Set<Verdict> {
    const ep = this.getHttpEndpointByParts(receiverId, port, method, urlPathname);

    return ep?.verdicts ?? new Set();
  }

  private addLink(hubbleLink: HubbleLink) {
    if (this.linksMap.has(hubbleLink.id)) return; // this.updateLink(hubbleLink);

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

    // TODO: Why this O(n) search?
    const idx = this._links.findIndex(l => l.id === hubbleLink.id);
    if (idx === -1) return;

    const currentLink = this._links[idx];
    const updatedLink = currentLink.updateWithHubbleLink(hubbleLink);

    this._links.splice(idx, 1, updatedLink);
  }

  public upsertLinks(links: Link[]) {
    links.forEach(l => {
      this.upsertHubbleLink(l.hubbleLink);
    });
  }

  public upsertHubbleLink(l: HubbleLink) {
    if (this.linksMap.has(l.id)) {
      this.updateLink(l);
    } else {
      this.addLink(l);
    }
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
