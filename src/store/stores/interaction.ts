import _ from 'lodash';
import { action, observable, computed } from 'mobx';

import { Flow, HubbleFlow } from '~/domain/flows';
import { Link, AccessPoints } from '~/domain/service-map';
import { ids } from '~/domain/ids';
import { HubbleLink } from '~/domain/hubble';
import { StateChange } from '~/domain/misc';
import { flowFromRelay } from '~/domain/helpers';
import { filterFlow, Filters } from '~/domain/filtering';

// { cardId -> { cardId -> { acessPointId : Link }  }
export type ConnectionsMap = Map<string, Map<string, Map<string, Link>>>;

export interface Connections {
  readonly outgoings: ConnectionsMap;
  readonly incomings: ConnectionsMap;
}

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

  @observable flows: Array<Flow>;
  @observable links: Array<Link>;

  constructor() {
    this.flows = [];
    this.links = [];
  }

  // TODO: be careful with shallow cloning
  clone(deep = false): InteractionStore {
    const store = new InteractionStore();

    store.flows = deep ? _.cloneDeep(this.flows) : this.flows.slice();
    store.links = deep ? _.cloneDeep(this.links) : this.links.slice();

    return store;
  }

  @action.bound
  clear() {
    this.clearFlows();
    this.clearLinks();
  }

  @action.bound
  clearFlows() {
    this.flows = [];
  }

  @action.bound
  clearLinks() {
    this.links = [];
  }

  @action.bound
  addHubbleLinks(hubbleLinks: HubbleLink[]) {
    hubbleLinks.forEach(this.addLink);
  }

  @action.bound
  setLinks(links: Link[]) {
    this.links = links;
  }

  @action.bound
  setHubbleFlows(hubbleFlows: HubbleFlow[], opts?: SetOptions) {
    const flows = hubbleFlows.map(flowFromRelay);
    return this.setFlows(flows, opts);
  }

  @action.bound
  setFlows(flows: Flow[], opts?: SetOptions) {
    if (!opts?.sort) {
      this.flows = flows;
      return;
    }

    this.flows = flows.slice().sort((a, b) => {
      return b.millisecondsTimestamp! - a.millisecondsTimestamp!;
    });
  }

  @action.bound
  addFlows(flows: Flow[]) {
    this.flows = _(flows)
      .concat(this.flows)
      .uniqBy(f => f.id)
      .sort((a, b) => b.millisecondsTimestamp! - a.millisecondsTimestamp!)
      .slice(0, InteractionStore.FLOWS_MAX_COUNT)
      .value();

    return {
      flowsTotalCount: this.flows.length,
      flowsDiffCount: flows.length,
    };
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
    const wasNFlows = rhs.flows.length;
    const { flowsTotalCount } = rhs.addFlows(this.flows);

    let newLinks = 0;
    this.links.forEach((link: Link) => {
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

    this.links.push(link);
    return true;
  }

  @action.bound
  private addLink(hubbleLink: HubbleLink) {
    if (this.linksMap.has(hubbleLink.id)) return this.updateLink(hubbleLink);

    this.links.push(Link.fromHubbleLink(hubbleLink));
  }

  @action.bound
  private deleteLink(hubbleLink: HubbleLink) {
    if (!this.linksMap.has(hubbleLink.id)) return;

    const idx = this.links.findIndex(l => l.id === hubbleLink.id);
    if (idx === -1) return;

    const currentHubbleLink = this.links[idx];
    if (currentHubbleLink.verdicts.size > 1) {
      currentHubbleLink.verdicts.delete(hubbleLink.verdict);
      return;
    }

    this.links.splice(idx, 1);
  }

  @action.bound
  private updateLink(hubbleLink: HubbleLink) {
    if (!this.linksMap.has(hubbleLink.id)) return;

    const idx = this.links.findIndex(l => l.id === hubbleLink.id);
    if (idx === -1) return;

    const currentLink = this.links[idx];
    const updatedLink = currentLink.updateWithHubbleLink(hubbleLink);

    this.links.splice(idx, 1, updatedLink);
  }

  @computed
  get connections(): Connections {
    // Connections only gives information about what services are connected
    // and by which access point (apId), it doesnt provide geometry information
    //
    // outgoings: { senderId -> { receiverId -> Connection } }
    //                   apIds sets are equal --> ||
    // incomings: { receiverId -> { senderId -> Connection } }

    const outgoings: ConnectionsMap = new Map();
    const incomings: ConnectionsMap = new Map();

    this.links.forEach((link: Link) => {
      const senderId = link.sourceId;
      const receiverId = link.destinationId;
      const accessPointId = ids.accessPoint(receiverId, link.destinationPort);

      // Outgoing connection setup
      if (!outgoings.has(senderId)) {
        outgoings.set(senderId, new Map());
      }

      const sentTo = outgoings.get(senderId)!;
      if (!sentTo.has(receiverId)) {
        sentTo.set(receiverId, new Map());
      }

      const connectionProps: Map<string, Link> = sentTo.get(receiverId)!;
      connectionProps.set(accessPointId, link);

      // Incoming connection setup
      if (!incomings.has(receiverId)) {
        incomings.set(receiverId, new Map());
      }

      const receivedFrom = incomings.get(receiverId)!;
      if (!receivedFrom.has(senderId)) {
        receivedFrom.set(senderId, connectionProps);
      }
    });

    return { outgoings, incomings };
  }

  @computed
  get accessPoints(): AccessPoints {
    const index: AccessPoints = new Map();

    this.links.forEach((l: Link) => {
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

  @computed get all() {
    return {
      links: this.links,
    };
  }

  @computed get linksMap(): Map<string, Link> {
    const index = new Map();

    this.links.forEach((l: Link) => {
      index.set(l.id, l);
    });

    return index;
  }
}
