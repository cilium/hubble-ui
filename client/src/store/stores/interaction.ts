import _ from 'lodash';
import { observable } from 'mobx';
import { Flow, HubbleFlow } from '~/domain/flows';
import { Link } from '~/domain/service-map';

// This store maintains ANY interactions that may present on the map
export default class InteractionStore {
  @observable
  public flows: Array<Flow>;

  @observable
  public links: Array<Link>;

  constructor() {
    this.flows = [];
    this.links = [];
  }

  public setLinks(links: Array<Link>) {
    this.links = links;
  }

  public addFlows(flows: Array<HubbleFlow>) {
    const nextFlows = _(flows)
      .reverse()
      .map(f => new Flow(f))
      .concat(this.flows)
      .uniqBy(f => f.id)
      .value();

    if (this.flows.length < nextFlows.length) {
      this.flows = nextFlows.slice(0, 1000);
    }
  }

  get all() {
    return {
      links: this.links,
    };
  }
}
