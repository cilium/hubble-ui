import { observable } from 'mobx';
import { Flow, IFlow } from '~/domain/flows';
import { Link } from '~/domain/service-map';

// This store maintains ANY interactions that may received from relay API
export default class InteractionStore {
  @observable
  public flows: Array<Flow>;

  @observable
  public links: Array<Link>;

  constructor() {
    this.flows = [];
    this.links = [];
  }

  public setFlows(flows: Array<IFlow>) {
    this.flows = flows.map(flow => new Flow(flow));
  }
}
