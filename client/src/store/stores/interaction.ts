import uniqBy from 'lodash/uniqBy';
import { observable } from 'mobx';
import { Flow, IFlow } from '~/domain/flows';
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

  public setFlows(flows: Array<IFlow>) {
    this.flows = flows.map(flow => new Flow(flow));
  }

  public addFlows(flows: Array<IFlow>) {
    const newFlows = flows.map(flow => new Flow(flow));
    const concatFlows = newFlows.concat(this.flows);
    const uniqFlows = uniqBy(concatFlows, f => f.id);
    if (this.flows.length < uniqFlows.length) {
      this.flows = uniqFlows;
    }
  }

  get all() {
    return {
      links: this.links,
    };
  }
}
