import { observable } from 'mobx';
import { Link } from '~/domain/service-map';

// This store maintains ANY interactions that may received from relay API
export default class InteractionStore {
  @observable
  public links: Array<Link>;

  constructor() {
    this.links = [];
  }
}
