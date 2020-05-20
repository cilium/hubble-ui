import _ from 'lodash';
import { action, observable, computed } from 'mobx';

import { Flow, HubbleFlow } from '~/domain/flows';
import { Link } from '~/domain/service-map';
import { StateChange } from '~/domain/misc';

// This store maintains ANY interactions that may present on the map
export default class InteractionStore {
  public static readonly FLOWS_MAX_COUNT = 1000;

  @observable flows: Array<Flow>;
  @observable links: Array<Link>;

  constructor() {
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
