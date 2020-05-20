import _ from 'lodash';
import { action, observable, computed } from 'mobx';
import { Flow, HubbleFlow } from '~/domain/flows';
import { Link } from '~/domain/service-map';

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

  @computed get all() {
    return {
      links: this.links,
    };
  }
}
