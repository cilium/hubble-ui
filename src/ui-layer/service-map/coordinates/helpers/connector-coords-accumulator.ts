import { XY, Vec2 } from '~/domain/geometry';
import { LinkConnections } from '~/domain/interactions/connections';
import { ids } from '~/domain/ids';

import { sizes } from '~/ui/vars';

import { ServiceMapPlacementStrategy } from '..';

const connectorGap = sizes.distanceBetweenConnectors;

export type AdjustedConnector = {
  connectorId: string;
  connectorCoords: XY;
};

export class ConnectorCoordsAccumulator {
  private cardConnectorIds: Map<string, Set<string>> = new Map();
  private cardConnectorCoords: Map<string, XY> = new Map();

  constructor(
    private readonly connections: LinkConnections,
    private readonly connectorMidPoints: Map<string, Vec2>,
    private readonly placement: ServiceMapPlacementStrategy,
  ) {}

  public accumulate(senderId: string, receiverId: string): AdjustedConnector | null {
    const senderBBox = this.placement.cardsBBoxes.get(senderId);
    if (senderBBox == null) return null;

    const receiverBBox = this.placement.cardsBBoxes.get(receiverId);
    if (receiverBBox == null) return null;

    const receiverAccessPoints = this.connections.outgoings.get(senderId)?.get(receiverId);
    if (receiverAccessPoints == null) return null;

    const connectorId = ids.cardConnector(receiverId, receiverAccessPoints.keys());

    const existing = this.cardConnectorCoords.get(connectorId);
    if (existing != null) return { connectorId, connectorCoords: existing };

    // NOTE: Check how many connectors this receiver has...
    const connectors = this.cardConnectorIds.get(receiverId) ?? new Set();

    // NOTE: ...and use this value as an index of new connector
    const connectorIdx = connectors.size;
    connectors.add(connectorId);

    // NOTE: Since we don't know at this stage how many connectors will be added
    // NOTE: we simply put them under the middle of the receiver card endpoints.
    // NOTE: When all connectors are processed, call adjustVertically() method
    // NOTE: to shift all stored coords towards the head of the receiver.
    const midPoint = this.connectorMidPoints.get(receiverId);
    if (midPoint == null) return null;

    this.cardConnectorIds.set(receiverId, connectors);
    const connectorCoords = midPoint.clone();

    // NOTE: X coord is always the same for this receiver
    connectorCoords.x = receiverBBox.x - sizes.connectorCardEndGap;

    // NOTE: Here is where actual vertical shifted coord is calculated.
    connectorCoords.y += connectorIdx * connectorGap;

    this.cardConnectorCoords.set(connectorId, connectorCoords);

    return { connectorId, connectorCoords };
  }

  // NOTE: This method fixes coords on stored data and thus, it's important to
  // NOTE: keep references to that coords, not deep-cloning them.
  // NOTE: We simple subtract a half of entire connectors height here to make
  // NOTE: them all centered on vertical axis.
  public adjustVertically() {
    this.cardConnectorIds.forEach((connectorIds, _cardId) => {
      connectorIds.forEach(connectorId => {
        const connectorCoords = this.cardConnectorCoords.get(connectorId);
        if (connectorCoords == null) {
          console.error('wrong connector coords management');
          return;
        }

        // NOTE: Here is where we are centering entire connectors column
        const gutHeight = (connectorIds.size - 1) * connectorGap;
        connectorCoords.y -= gutHeight / 2;
      });
    });
  }
}
