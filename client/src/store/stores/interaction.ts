import _ from 'lodash';
import { action, observable, computed } from 'mobx';

import { Flow, HubbleFlow } from '~/domain/flows';
import { Link } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';

import { ids } from '~/domain/ids';

// { cardId -> { cardId -> Set(apIds) } }
export type ConnectionsMap = Map<string, Map<string, Set<string>>>;

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
    this.flows = [];
    this.links = [];
  }

  @action.bound
  setLinks(links: Array<Link>) {
    this.links = links;
  }

  @action.bound
  clearFlows() {
    this.flows = [];
  }

  @action.bound
  addFlows(flows: Array<HubbleFlow>) {
    this.flows = _(flows)
      .reverse()
      .map(f => new Flow(f))
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
  applyLinkChange(link: Link, change: StateChange) {
    if (change === StateChange.Deleted) {
      return this.deleteLink(link);
    }

    // TODO: handle all cases properly
    const idx = this.links.findIndex(l => l.id === link.id);
    if (idx !== -1) return;

    this.links.push(link);
  }

  @action.bound
  deleteLink(link: Link) {
    if (!this.linksMap.has(link.id)) return;

    const idx = this.links.findIndex(l => l.id === link.id);
    if (idx === -1) return;

    this.links.splice(idx, 1);
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

    this.links.forEach((l: Link) => {
      const senderId = l.sourceId;
      const receiverId = l.destinationId;
      const apId = ids.accessPoint(receiverId, l.destinationPort);

      // Outgoing connection setup
      if (!outgoings.has(senderId)) {
        outgoings.set(senderId, new Map());
      }

      const sentTo = outgoings.get(senderId)!;
      if (!sentTo.has(receiverId)) {
        sentTo.set(receiverId, new Set());
      }

      const sentToApIds = sentTo.get(receiverId)!;
      sentToApIds.add(apId);

      // Incoming connection setup
      if (!incomings.has(receiverId)) {
        incomings.set(receiverId, new Map());
      }

      const receivedFrom = incomings.get(receiverId)!;
      if (!receivedFrom.has(senderId)) {
        receivedFrom.set(senderId, new Set());
      }

      const receivedToApIds = receivedFrom.get(senderId)!;
      receivedToApIds.add(apId);
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
