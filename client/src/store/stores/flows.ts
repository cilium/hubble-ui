import { observable } from 'mobx';
import { Flow } from '~/domain/data';

export default class FlowsStore {
  @observable
  public flows: Array<Flow>;

  constructor() {
    this.flows = [];
  }

  get data() {
    return this.flows;
  }

  public set(flows: Array<Flow>) {
    this.flows = flows;
  }
}
