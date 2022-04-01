import { action, computed, observable, reaction, makeObservable } from 'mobx';

import { StoreFrame } from '~/store/frame';

import { sizes } from '~/ui/vars';
import { Vec2 } from '~/domain/geometry';
import { ArrowStrategy } from '~/domain/layout/abstract';
import { ServiceMapPlacementStrategy } from '~/domain/layout/service-map/placement';

import InteractionStore from '~/store/stores/interaction';
import ServiceStore from '~/store/stores/service';

import { ServiceMapArrow } from './arrow';
import {
  ConnectorCoordsAccumulator,
  createCardOffsetAdvancers,
} from './helpers';

// NOTE: This strategry determines coords of arrows that are to be rendered on
// NOTE: ServiceMap
export class ServiceMapArrowStrategy extends ArrowStrategy {
  @observable
  private placement: ServiceMapPlacementStrategy;

  @observable
  private interactions: InteractionStore;

  @observable
  private services: ServiceStore;

  constructor(frame: StoreFrame, placement: ServiceMapPlacementStrategy) {
    super();
    makeObservable(this);

    this.interactions = frame.interactions;
    this.services = frame.services;
    this.placement = placement;

    reaction(
      () => this.arrowsMap,
      () => {
        this.rebuildArrowsMap();
      },
      { delay: 10 },
    );
  }

  @action.bound
  private rebuildArrowsMap() {
    this._arrows.clear();
    this.arrowsMap.forEach((arrow, arrowId) => {
      this._arrows.set(arrowId, arrow);
    });
  }

  @computed
  public get arrowsMap(): Map<string, ServiceMapArrow> {
    const arrows: Map<string, ServiceMapArrow> = new Map();
    const bboxes = this.placement.cardsBBoxes;

    // NOTE: Keep track of how many connectors a receiver has to properly
    // NOTE: compute vertical coordinate of next connector
    const cardConnectorCoords = new ConnectorCoordsAccumulator(
      this.connections,
      this.connectorMidPoints,
      this.placement,
    );

    this.connections.outgoings.forEach((receivers, senderId) => {
      const senderBBox = bboxes.get(senderId);
      if (senderBBox == null) return;

      receivers.forEach((receiverAccessPoints, receiverId) => {
        const receiverBBox = bboxes.get(receiverId);
        if (receiverBBox == null) return;

        // NOTE: Save sender/receiver bboxes to be able to construct path
        // NOTE: that walks around those bboxes later
        const arrow = ServiceMapArrow.new()
          .from(senderId, senderBBox)
          .to(receiverId, receiverBBox);

        arrows.set(arrow.id, arrow);

        const connector = cardConnectorCoords.accumulate(senderId, receiverId);
        if (connector == null) return;
        const { connectorId, connectorCoords } = connector;

        // NOTE: Arrow starts from the same point on top right of the card and
        // NOTE: ends on the connector coords.
        // NOTE: Add initial beginning and ending and bend arrow if needed to
        // NOTE: go around some boxes (sender and receiver bboxes)
        arrow
          .addPoint({
            x: senderBBox.x + senderBBox.w,
            y: senderBBox.y + sizes.arrowStartTopOffset,
          })
          .addPoint(connectorCoords);

        const receiverHttpEndpoints =
          this.placement.httpEndpointCoords.get(receiverId);

        const areHttpEndpointsVisible =
          receiverHttpEndpoints == null ||
          !this.services.activeCards.has(receiverId);

        // NOTE: Here we build small arrows from card outer connector to
        // NOTE: endpoint connectors (points and http endpoints)
        receiverAccessPoints.forEach((link, apId) => {
          const coords = this.placement.accessPointCoords.get(apId);
          if (coords == null) return;

          // NOTE: We put the only one point into the AccessPointArrow assuming
          // NOTE: that the inner arrow could be rendered using connector coords
          // NOTE: from the ServiceMapArrow
          arrow
            .addAccessPointArrow(connectorId, apId)
            .addVerdicts(link.verdicts)
            .addPoint(coords);

          if (areHttpEndpointsVisible) return;

          // NOTE: For simplicty, treat HTTP endpoints as a regular access
          // NOTE: points.
          receiverHttpEndpoints.forEach((methods, urlPath) => {
            methods.forEach((xy, method) => {
              const l7endpoint = this.interactions.getHttpEndpointByParts(
                receiverId,
                link.destinationPort,
                method,
                urlPath,
              );

              if (l7endpoint == null) {
                console.warn(
                  'ServiceMapArrow building: cannot find appropriate L7Endpoint',
                );

                return;
              }

              arrow
                .addAccessPointArrow(connectorId, l7endpoint.id)
                .addVerdicts(l7endpoint.verdicts)
                .addPoint(xy);
            });
          });
        });
      });
    });

    cardConnectorCoords.adjustVertically();
    // NOTE: Now, when all connector coords adjusted properly, we can alter
    // NOTE: arrow points to fit the appropriate path.

    // NOTE: Keep track of all arrows that go around sender and receiver
    // NOTE: bboxes, not to put them on overlapping parallel paths when that
    // NOTE: path goes near the edges of the card.
    const offsets = createCardOffsetAdvancers();

    arrows.forEach(arrow => {
      arrow.buildPointsAroundSenderAndReceiver(offsets);
    });

    return arrows;
  }

  @computed
  private get connections() {
    return this.interactions.connections;
  }

  // Gives mid of physical APs
  // { cardId -> Vec2 }
  @computed
  private get connectorMidPoints(): Map<string, Vec2> {
    const index = new Map<string, Vec2>();

    this.services.cardsList.forEach(card => {
      if (card.accessPoints.size === 0) return;
      const position = Vec2.zero();
      let nPoints = card.accessPoints.size;

      card.accessPoints.forEach(accessPoint => {
        const coords = this.placement.accessPointCoords.get(accessPoint.id);
        if (!coords) return;

        position.addInPlace(coords);
      });

      const httpEndpoints = this.placement.httpEndpointCoords.get(card.id);
      if (httpEndpoints != null && this.services.activeCards.has(card.id)) {
        httpEndpoints.forEach(methods => {
          methods.forEach(coords => {
            position.addInPlace(coords);
          });

          nPoints += methods.size;
        });
      }

      index.set(card.id, position.mul(1 / nPoints));
    });

    return index;
  }
}
