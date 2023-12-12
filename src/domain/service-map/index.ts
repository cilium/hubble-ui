import * as mobx from 'mobx';

import { HubbleService, HubbleLink } from '~/domain/hubble';

import { LinkConnections } from '~/domain/interactions/connections';
import { Link } from '~/domain/link';
export { Link };

export { ApplicationKind } from './types';
export { ServiceCard } from './card';

export type Service = HubbleService;

export class ServiceMap {
  public services: Map<string, Service>;

  // NOTE: couple of { svcId -> { svcId -> { endpointId -> Endpoint }}} maps
  public links: LinkConnections;

  public static empty(): ServiceMap {
    return new ServiceMap([], []);
  }

  public static fromHubbleParts(svcs: Service[], links: HubbleLink[]): ServiceMap {
    return new ServiceMap(svcs, links.map(Link.fromHubbleLink));
  }

  constructor(svcs: Service[], links: Link[]) {
    this.services = new Map();

    svcs.forEach(svc => {
      this.services.set(svc.id, svc);
    });

    this.links = LinkConnections.buildFromLinks(links);

    mobx.makeAutoObservable(this, void 0, {
      autoBind: true,
    });
  }

  public log() {
    console.log(`Service Map services:`);
    this.services.forEach((svc, id) => {
      console.log(`  ${id} -> `, mobx.toJS(svc));
    });

    console.log('Service Map outgoing links: ');
    this.links.outgoings.forEach((receivers, senderId) => {
      receivers.forEach((aps, receiverId) => {
        const apKeys = [...aps.keys()].join(', ');
        console.log(`  ${senderId} -> ${receiverId} -> ${apKeys}`);
      });
    });

    console.log('Service Map incoming links: ');
    this.links.incomings.forEach((receivers, receiverId) => {
      receivers.forEach((aps, senderId) => {
        const apKeys = [...aps.keys()].join(', ');
        console.log(`  ${senderId} -> ${receiverId} -> ${apKeys}`);
      });
    });

    console.log('Service Map linksList: ');
    this.links.linksList.forEach(l => {
      console.log(
        `  Link (id: ${l.id}): ${l.sourceId} -> ${l.destinationId}:${l.destinationPort}`,
        l,
      );
    });
  }

  public get servicesList(): Service[] {
    return Array.from(this.services.values());
  }

  public get linksList(): Link[] {
    return this.links.linksList;
  }

  public get isEmpty(): boolean {
    return this.services.size === 0;
  }
}
