import { action, computed, observable, makeObservable } from 'mobx';

import { MapUtils } from '~/utils/iter-tools/map';
import { Vec2 } from '~/domain/geometry';

import { sizes } from '~/ui/vars';
import { ArrowStrategy } from '~/ui/layout/abstract';

import { StoreFrame } from '~/store/frame';
import { InteractionStore } from '~/store/stores/interaction';
import { ServiceStore } from '~/store/stores/service';
import { ControlStore } from '~/store/stores/controls';

import { ServiceMapPlacementStrategy } from './placement';
import { AccessPointArrow, ServiceMapArrow } from './arrow';
import { ConnectorCoordsAccumulator, createCardOffsetAdvancers } from './helpers';

export type CombinedAccessPointArrows = Map<string, Map<string, AccessPointArrow>>;

// NOTE: This strategry determines coords of arrows that are to be rendered on
// NOTE: ServiceMap
export class ServiceMapArrowStrategy extends ArrowStrategy {
  @observable
  private placement: ServiceMapPlacementStrategy;

  @observable
  private interactions: InteractionStore;

  @observable
  private services: ServiceStore;

  @observable
  private controls: ControlStore;

  // NOTE: { connectorId -> { apArrowId -> AccessPointArrow }}
  @observable
  private _combinedAccessPointArrows: CombinedAccessPointArrows = new Map();

  constructor(frame: StoreFrame, placement: ServiceMapPlacementStrategy) {
    super();
    makeObservable(this);

    this.interactions = frame.interactions;
    this.services = frame.services;
    this.controls = frame.controls;
    this.placement = placement;
  }

  @action.bound
  public rebuild() {
    this.rebuildArrows();
  }

  @action.bound
  public clear() {
    this._arrows.clear();
    this._combinedAccessPointArrows.clear();
  }

  @action.bound
  private rebuildArrows() {
    this.clear();

    this.arrowsMap.forEach((arrow, arrowId) => {
      this._arrows.set(arrowId, arrow);
    });

    // NOTE: This operation walks through entire AccessPointArrows and eliminate
    // overlapping ones, i e if there are two different arrows from different
    // sender cards, they can have different verdicts to the same AccessPoint.
    // In this case multiple duplicated arrows would be rendered, but only one
    // of them (topmost) will be visible.
    this.combinedAccessPointArrows.forEach((arrow, arrowId) => {
      this._combinedAccessPointArrows.set(arrowId, arrow);
    });
  }

  @computed
  public get combinedAccessPointArrows(): CombinedAccessPointArrows {
    const combined: CombinedAccessPointArrows = new Map();

    const arrows = this._arrows as Map<string, ServiceMapArrow>;
    if (!(MapUtils.pickFirst(arrows) instanceof ServiceMapArrow)) {
      return combined;
    }

    arrows.forEach((arrow, _arrowId) => {
      arrow.accessPointArrows.forEach((apArrow, apArrowId) => {
        if (apArrow.connectorId == null) return;

        if (!combined.has(apArrow.connectorId)) {
          combined.set(apArrow.connectorId, new Map());
        }

        const connectorArrows = combined.get(apArrow.connectorId);
        if (connectorArrows == null) return;

        // NOTE: apArrowId looks like `<connectorId> -> <apId>`
        const existing = connectorArrows.get(apArrowId);
        if (existing == null) {
          connectorArrows.set(apArrowId, apArrow);
          return;
        }

        existing.addVerdicts(apArrow.verdicts);
      });
    });

    return combined;
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

        const receiverCard = this.services.byId(receiverId);
        if (receiverCard == null) return;
        // NOTE: Save sender/receiver bboxes to be able to construct path
        // NOTE: that walks around those bboxes later

        const arrow = ServiceMapArrow.new().from(senderId, senderBBox).to(receiverId, receiverBBox);

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

        const receiverHttpEndpoints = this.placement.httpEndpointCoords.get(receiverId);
        const isReceiverActive = this.controls.areSomeFilterEntriesEnabled(
          receiverCard.filterEntries,
        );

        const areHttpEndpointsHidden = receiverHttpEndpoints == null || !isReceiverActive;

        // NOTE: Here we build small arrows from card outer connector to
        // NOTE: endpoint connectors (points and http endpoints)
        receiverAccessPoints.forEach((link, apId) => {
          const coords = this.placement.accessPointCoords.get(apId);
          if (coords == null) return;

          arrow
            .addLinkThroughput(link.throughput)
            .addAccessPointArrow(connectorId, apId)
            .addVerdicts(link.verdicts)
            .addAuthTypes(link.authTypes)
            .setEncryption(link.isEncrypted)
            .addPoint(connectorCoords)
            .addPoint(coords);

          if (areHttpEndpointsHidden) return;

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
                  apId,
                  method,
                  urlPath,
                );

                return;
              }

              arrow
                .addAccessPointArrow(connectorId, l7endpoint.id)
                .addVerdicts(l7endpoint.verdicts)
                .addAuthTypes(link.authTypes)
                .setEncryption(link.isEncrypted)
                .addPoint(connectorCoords)
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
      arrow.computeFlowsInfoIndicatorPosition();
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
      if (httpEndpoints != null && this.controls.areSomeFilterEntriesEnabled(card.filterEntries)) {
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
