import {
  action,
  computed,
  observable,
  reaction,
  trace,
  makeObservable,
} from 'mobx';

import { StoreFrame } from '~/store/frame';

import { sizes } from '~/ui/vars';
import { Vec2 } from '~/domain/geometry';
import { PlacementStrategy, ArrowStrategy } from '~/domain/layout/abstract';
import {
  ArrowsMap,
  ArrowEnding,
  ArrowColor,
  ArrowPath,
  InnerEnding,
  EndingFigure,
} from '~/domain/layout/abstract/arrows';

import { Verdict } from '~/domain/hubble';
import { ServiceMapPlacementStrategy } from '~/domain/layout/service-map/placement';

import ControlStore from '~/store/stores/controls';
import InteractionStore from '~/store/stores/interaction';
import ServiceStore from '~/store/stores/service';

import { ids } from '~/domain/ids';

export class ServiceMapArrowStrategy extends ArrowStrategy {
  @observable
  private placement: ServiceMapPlacementStrategy;

  @observable
  private controls: ControlStore;

  @observable
  private interactions: InteractionStore;

  @observable
  private services: ServiceStore;

  constructor(frame: StoreFrame, placement: ServiceMapPlacementStrategy) {
    super();
    makeObservable(this);
    this.controls = frame.controls;
    this.interactions = frame.interactions;
    this.services = frame.services;
    this.placement = placement;

    reaction(
      () => this.arrowsMap,
      (_, r) => {
        this.rebuildArrowsMap();
      },
      { delay: 10 },
    );
  }

  @action.bound
  public reset() {
    this.arrows.clear();
  }

  @action.bound
  private rebuildArrowsMap() {
    this.arrows.clear();
    this.arrowsMap.forEach((arrow, arrowId) => {
      this.arrows.set(arrowId, arrow);
    });
  }

  @computed
  public get arrowsMap(): ArrowsMap {
    const arrows: ArrowsMap = new Map();

    // NOTE: we keep track of how many connectors a receiver has to properly
    // NOTE: compute vertical coordinate of next connector
    const cardConnectors: Map<string, Set<string>> = new Map();
    const allConnectorsCoords: Map<string, Vec2> = new Map();
    const connectorEndings: Map<string, Map<string, InnerEnding>> = new Map();

    const connectorGap = sizes.distanceBetweenConnectors;

    this.connections.outgoings.forEach((senderIndex, senderId) => {
      const senderBBox = this.placement.cardsBBoxes.get(senderId);
      if (senderBBox == null) return;

      senderIndex.forEach((receiverAccessPoints, receiverId) => {
        const receiverBBox = this.placement.cardsBBoxes.get(receiverId);
        if (receiverBBox == null) return;

        const midPoint = this.connectorMidPoints.get(receiverId);
        if (midPoint == null) return;

        // NOTE: we always start from the same point on top right of the card
        const arrowStart = Vec2.from(
          senderBBox.x + senderBBox.w,
          senderBBox.y + sizes.arrowStartTopOffset,
        );

        // NOTE: start arrow has vertical plate at the beginning
        const start: ArrowEnding = {
          endingId: senderId,
          figure: EndingFigure.Plate,
          coords: arrowStart,
          aroundBBox: senderBBox,
        };

        const arrowId = `${senderId} -> ${receiverId}`;
        const connectorId = ids.cardConnector(
          receiverId,
          receiverAccessPoints.keys(),
        );

        let connectorCoords = allConnectorsCoords.get(connectorId);
        if (connectorCoords == null) {
          const connectors = cardConnectors.get(receiverId) ?? new Set();
          const connectorIdx = connectors.size;
          connectors.add(connectorId);

          cardConnectors.set(receiverId, connectors);
          connectorCoords = midPoint.clone();

          // NOTE: Here we just push a connector closer to bottom, but later
          // NOTE: we will subtract a half of entire connectors height
          // NOTE: to make all connectors centered.
          connectorCoords.x = receiverBBox.x - sizes.connectorCardGap;
          connectorCoords.y += connectorIdx * connectorGap;

          allConnectorsCoords.set(connectorId, connectorCoords);
        }

        if (!connectorEndings.has(connectorId)) {
          connectorEndings.set(connectorId, new Map());
        }
        const innerEndings = connectorEndings.get(connectorId)!;
        const receiverHttpEndpoints =
          this.placement.httpEndpointCoords.get(receiverId);

        // NOTE: this logic leads to ambiguity: multiple cards can have same
        // NOTE: connector, but its impossible to make a reverse mapping
        // NOTE: from (sender -> access point)

        // NOTE: Here we are gonna to make inner endings, i e small arrows
        // NOTE: from card outer connector to endpoint connectors (e g ports)
        receiverAccessPoints.forEach((_, apId) => {
          const coords = this.placement.accessPointCoords.get(apId);
          if (coords == null) return;

          const innerEndingId = `${connectorId} -> ${apId}`;
          const apEndings = innerEndings.get(apId);
          const endingColors = this.getVerdictColors(
            senderId,
            receiverId,
            apId,
          );

          if (apEndings == null) {
            innerEndings.set(innerEndingId, {
              endingId: innerEndingId,
              colors: endingColors,
              coords: Vec2.fromXY(coords),
            });
          } else {
            endingColors.forEach(color => {
              apEndings.colors.add(color);
            });
          }

          // NOTE: HTTP endpoints processing
          if (
            receiverHttpEndpoints == null ||
            !this.services.activeCards.has(receiverId)
          )
            return;

          receiverHttpEndpoints.forEach((methods, urlPath) => {
            methods.forEach((xy, method) => {
              const innerEndingId = `${connectorId} -> ${urlPath}`;

              innerEndings.set(innerEndingId, {
                endingId: innerEndingId,
                colors: endingColors,
                coords: Vec2.fromXY(xy),
              });
            });
          });
        });

        const end: ArrowEnding = {
          endingId: receiverId,
          figure: EndingFigure.Circle,
          coords: connectorCoords,
          aroundBBox: receiverBBox,
          innerEndings,
        };

        const arrow = {
          arrowId,
          color: ArrowColor.Neutral,

          start,
          end,
        };

        arrows.set(arrowId, arrow);
      });
    });

    cardConnectors.forEach((connectorIds, cardId) => {
      connectorIds.forEach(connectorId => {
        const connectorCoords = allConnectorsCoords.get(connectorId);
        if (connectorCoords == null) {
          console.error('wrong connector coords management');
          return;
        }

        // NOTE: Here is where we are centering entire connectors column
        const gutHeight = (connectorIds.size - 1) * connectorGap;
        connectorCoords.y -= gutHeight / 2;
      });
    });

    return arrows;
  }

  private getVerdictColors(
    senderId: string,
    receiverId: string,
    apId: string,
  ): Set<ArrowColor> {
    const sender = this.interactions.connections.outgoings.get(senderId);
    if (sender == null) return new Set([ArrowColor.Neutral]);

    const receiver = sender.get(receiverId);
    if (receiver == null) return new Set([ArrowColor.Neutral]);

    const link = receiver.get(apId);
    if (link == null) return new Set([ArrowColor.Neutral]);

    const mapped = [...link.verdicts].map(verdict => {
      switch (verdict) {
        case Verdict.Forwarded:
        case Verdict.Unknown:
          return ArrowColor.Neutral;
        default:
          return ArrowColor.Red;
      }
    });

    return new Set(mapped);
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
