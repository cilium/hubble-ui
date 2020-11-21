import { Link, AccessPoint } from '~/domain/service-map';

// { cardId -> { cardId -> { acessPointId : Link }  }
export type ConnectionsMap = Map<string, Map<string, Map<string, Link>>>;

export class Connections {
  public readonly outgoings: ConnectionsMap;
  public readonly incomings: ConnectionsMap;

  public static build(links: Link[]): Connections {
    // Connections only gives information about what services are connected
    // and by which access point (apId), it doesnt provide geometry information
    //
    // outgoings: { senderId -> { receiverId -> Connection } }
    //                   apIds sets are equal --> ||
    // incomings: { receiverId -> { senderId -> Connection } }

    const outgoings: ConnectionsMap = new Map();
    const incomings: ConnectionsMap = new Map();

    links.forEach((link: Link) => {
      const senderId = link.sourceId;
      const receiverId = link.destinationId;
      const accessPointId = AccessPoint.generateId(
        receiverId,
        link.destinationPort,
      );

      // Outgoing connection setup
      if (!outgoings.has(senderId)) {
        outgoings.set(senderId, new Map());
      }

      const sentTo = outgoings.get(senderId)!;
      if (!sentTo.has(receiverId)) {
        sentTo.set(receiverId, new Map());
      }

      const connectionProps: Map<string, Link> = sentTo.get(receiverId)!;
      connectionProps.set(accessPointId, link);

      // Incoming connection setup
      if (!incomings.has(receiverId)) {
        incomings.set(receiverId, new Map());
      }

      const receivedFrom = incomings.get(receiverId)!;
      if (!receivedFrom.has(senderId)) {
        receivedFrom.set(senderId, connectionProps);
      }
    });

    return new Connections(incomings, outgoings);
  }

  private constructor(incomings: ConnectionsMap, outgoings: ConnectionsMap) {
    this.incomings = incomings;
    this.outgoings = outgoings;
  }
}
