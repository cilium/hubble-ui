import { action, observable, reaction } from 'mobx';
import { ServiceCard } from '~/domain/service-card';
import { Link, Service } from '~/domain/service-map';

export default class ServiceStore {
  @observable
  public cards: Array<ServiceCard>;

  @observable
  public active: Map<string, boolean>;

  @observable
  private map: Map<string, ServiceCard>;

  constructor() {
    this.cards = [];
    this.map = new Map();
    this.active = new Map();

    reaction(
      () => this.cards,
      () => {
        this.rebuildIndex();
      },
    );
  }

  get data() {
    return this.cards;
  }

  get byId() {
    return (id: string) => {
      return this.map.get(id);
    };
  }

  get activeSet(): Set<string> {
    const k = [...this.active.keys()].filter(key =>
      Boolean(this.active.get(key)),
    );
    return new Set(k);
  }

  @action.bound
  public toggleActive(id: string) {
    const current = !!this.active.get(id);
    this.active.set(id, !current);
  }

  @action.bound
  public set(services: Array<Service>) {
    this.cards = services.map(ServiceCard.fromService);
  }

  @action.bound
  public updateLinkEndpoints(links: Array<Link>) {
    links.forEach((l: Link) => {
      const card = this.map.get(l.destinationId);
      if (card == null) return;

      card.updateLinkEndpoint(l);
    });
  }

  @action.bound
  private rebuildIndex() {
    console.info('rebuilding endpointsMap');

    this.cards.forEach(c => {
      this.map.set(c.service.id, c);
    });
  }
}
