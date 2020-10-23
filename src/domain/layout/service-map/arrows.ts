import { action, computed, observable, reaction } from 'mobx';

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

  constructor(
    controls: ControlStore,
    interactions: InteractionStore,
    services: ServiceStore,
    placement: ServiceMapPlacementStrategy,
  ) {
    super();
    this.controls = controls;
    this.interactions = interactions;
    this.services = services;
    this.placement = placement;

    reaction(() => [this.arrowsMap], this.rebuildArrowsMap);
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

        const arrowStart = Vec2.from(
          senderBBox.x + senderBBox.w,
          senderBBox.y + sizes.arrowStartTopOffset,
        );

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

          connectorCoords.x = receiverBBox.x - sizes.connectorCardGap;
          connectorCoords.y += connectorIdx * connectorGap;

          allConnectorsCoords.set(connectorId, connectorCoords);
        }

        if (!connectorEndings.has(connectorId)) {
          connectorEndings.set(connectorId, new Map());
        }
        const innerEndings = connectorEndings.get(connectorId)!;

        // NOTE: this logic leads to ambiguity: multiple cards can have same
        // NOTE: connector, but its impossible to make a reverse mapping
        // NOTE: from (sender -> access point)

        receiverAccessPoints.forEach((ap, apId) => {
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

            return;
          }

          endingColors.forEach(color => {
            apEndings.colors.add(color);
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

      card.accessPoints.forEach(accessPoint => {
        const coords = this.placement.accessPointCoords.get(accessPoint.id);
        if (!coords) return;

        position.addInPlace(coords);
      });

      index.set(card.id, position.mul(1 / card.accessPoints.size));
    });

    return index;
  }
}
