import * as mobx from 'mobx';

import { Link } from '~/domain/service-map';
import { Connections } from '~/domain/interactions/new-connections';
import { ServiceEndpoint } from '~/domain/interactions/endpoints';

export class LinkConnections {
  public readonly outgoings: Connections<Link>;
  public readonly incomings: Connections<Link>;

  // Connections only gives information about what services are connected
  // and by which access point (apId), it doesnt provide geometry information
  //
  // outgoings: { senderId -> { receiverId -> Connection } }
  //                   apIds sets are equal --> ||
  // incomings: { receiverId -> { senderId -> Connection } }
  public static buildFromLinks(links: Link[]): LinkConnections {
    const outgoings = new Connections<Link>();

    links.forEach((link: Link) => {
      const { sourceId: senderId, destinationId: receiverId, destinationPort } = link;

      const accessPointId = ServiceEndpoint.generateId(receiverId, destinationPort);
      outgoings.upsert(senderId, receiverId, accessPointId, link);
    });

    return new LinkConnections(outgoings);
  }

  public constructor(outgoings: Connections<Link>) {
    this.outgoings = outgoings;
    this.incomings = outgoings.getInversed();

    mobx.makeAutoObservable(this);
  }

  public get linksList(): Link[] {
    return this.outgoings.endpointList;
  }
}
