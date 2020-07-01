import _ from 'lodash';
import { action, observable, computed } from 'mobx';

import { Flow, HubbleFlow } from '~/domain/flows';
import { ids } from '~/domain/ids';
import { HubbleLink } from '~/domain/hubble';
import { Link, AccessPointMeta } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';
import { flowFromRelay, linkFromRelay } from '~/domain/helpers';

// { cardId -> { cardId -> { acessPointId : AccessPointMeta }  }
export type ConnectionsMap = Map<
  string,
  Map<string, Map<string, AccessPointMeta>>
>;

export interface Connections {
  readonly outgoings: ConnectionsMap;
  readonly incomings: ConnectionsMap;
}

// This store maintains ANY interactions that may present on the map
export default class InteractionStore {
  public static readonly FLOWS_MAX_COUNT = 500;

  @observable flows: Array<Flow>;
  @observable links: Array<Link>;

  constructor() {
    this.flows = [];
    this.links = [];
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
  setLinks(links: HubbleLink[]) {
    links.forEach(this.addLink);
  }

  @action.bound
  setFlows(flows: HubbleFlow[]) {
    this.flows = flows.map(flowFromRelay);
  }

  @action.bound
  addFlows(flows: HubbleFlow[]) {
    this.flows = _(flows)
      .reverse()
      .map(flowFromRelay)
      .concat(this.flows)
      .uniqBy(f => f.id)
      .value()
      .slice(0, InteractionStore.FLOWS_MAX_COUNT);

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
  private addLink(hubbleLink: HubbleLink) {
    if (this.linksMap.has(hubbleLink.id)) return this.updateLink(hubbleLink);

    this.links.push(linkFromRelay(hubbleLink));
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
    const updatedLink: Link = {
      ...currentLink,
      verdicts: new Set([...currentLink.verdicts, hubbleLink.verdict]),
    };

    this.links.splice(idx, 1, updatedLink);
  }

  @computed
  get connections(): Connections {
    // Connections only gives information about what services are connected
    // and by which access point (apId), it doesnt provide geometry information
    //
    // outgoings: { senderId -> { receiverId -> Set(apIds) } }
    //                   apIds sets are equal --> ||
    // incomings: { receiverId -> { senderId -> Set(apIds) } }

    const outgoings: ConnectionsMap = new Map();
    const incomings: ConnectionsMap = new Map();

    this.links.forEach((link: Link) => {
      const senderId = link.sourceId;
      const receiverId = link.destinationId;
      const acessPointId = ids.accessPoint(receiverId, link.destinationPort);

      // Outgoing connection setup
      if (!outgoings.has(senderId)) {
        outgoings.set(senderId, new Map());
      }

      const sentTo = outgoings.get(senderId)!;
      if (!sentTo.has(receiverId)) {
        sentTo.set(receiverId, new Map());
      }

      const sentToApIds = sentTo.get(receiverId)!;
      sentToApIds.set(acessPointId, { verdicts: link.verdicts });

      // Incoming connection setup
      if (!incomings.has(receiverId)) {
        incomings.set(receiverId, new Map());
      }

      const receivedFrom = incomings.get(receiverId)!;
      if (!receivedFrom.has(senderId)) {
        receivedFrom.set(senderId, new Map());
      }

      const receivedToApIds = receivedFrom.get(senderId)!;
      receivedToApIds.set(acessPointId, { verdicts: link.verdicts });
    });

    return { outgoings, incomings };
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
