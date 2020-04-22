import _ from 'lodash';
import { observable, reaction, autorun, trace, computed, action } from 'mobx';

import {
  PlacementEntry,
  Placement,
  ConnectorPlacement,
  ConnectorArrow,
  SenderArrows,
  SenderConnector,
} from '~/domain/layout';
import { WH, XYWH, Vec2, dummy as geom } from '~/domain/geometry';
import { ServiceCard } from '~/domain/service-card';
import { Link } from '~/domain/service-map';
import { ids } from '~/domain/ids';

import InteractionStore from './interaction';
import ServiceStore from './service';

import { sizes } from '~/ui/vars';

const hPadding = sizes.endpointHPadding;

export type ConnectionIndex = Map<
  string,
  Map<string, Map<string, ConnectorPlacement>>
>;

export type SenderConnectors = Map<string, Map<string, SenderConnector>>;

export default class LayoutStore {
  @observable
  private services: ServiceStore;

  @observable
  private interactions: InteractionStore;

  @observable
  private cardDimensions: Map<string, WH>;

  @observable
  public apCoords: Map<string, Vec2>; // { apId -> Vec2 }

  constructor(services: ServiceStore, interactions: InteractionStore) {
    this.services = services;
    this.interactions = interactions;

    this.cardDimensions = new Map();
    this.apCoords = new Map();

    reaction(
      () => this.services.cards,
      () => {
        this.initUnitializedCards();
      },
    );
  }

  public initUnitializedCards() {
    this.services.cards.forEach(card => {
      if (this.cardDimensions.has(card.id)) return;

      this.cardDimensions.set(card.id, this.defaultCardDims());
    });
  }

  public setAPCoords(id: string, coords: Vec2) {
    this.apCoords.set(id, coords);
  }

  @action.bound
  public setCardWH(id: string, props: WH) {
    this.cardDimensions.set(`service-${id}`, props);
  }

  @action.bound
  public setCardHeight(id: string, height: number) {
    const dim = this.cardDimensions.get(id) || this.defaultCardDims();
    const updated = Object.assign({}, dim, { h: height });

    this.cardDimensions.set(id, updated);
  }

  public get cardPlacement(): Map<string, PlacementEntry> {
    const index = new Map();

    this.services.cards.forEach((srvc: ServiceCard, i: number) => {
      const cardDims = this.cardDimensions.get(srvc.id);
      if (cardDims == null) return;

      const cardX = i * (cardDims.w + hPadding);
      const geometry = XYWH.empty()
        .setWH(cardDims)
        .setXY(cardX);
      const entry = { geometry, serviceCard: srvc };

      index.set(srvc.id, entry);
    });

    return index;
  }

  public get placement(): Placement {
    return [...this.cardPlacement.values()];
  }

  // { senderId -> SenderArrows }
  // SenderArrows: { senderId, startPoint, arrows: { receiverId -> Connector }}
  get connectionArrows(): Map<string, SenderArrows> {
    const arrows: Map<string, SenderArrows> = new Map();
    const curveGap = Vec2.from(sizes.connectorCardGap, 0);

    this.senderConnectors.forEach((senderIndex, senderId) => {
      const senderPlacement = this.cardPlacement.get(senderId)?.geometry;
      if (senderPlacement == null) return;

      // TODO: shadow size wat???, need to get rid of that
      const arrowStart = Vec2.from(
        senderPlacement.x + senderPlacement.w + sizes.endpointShadowSize,
        senderPlacement.y + sizes.arrowStartTopOffset,
      );

      const shiftedStart = arrowStart.add(curveGap);
      const arrow: SenderArrows = {
        senderId,
        startPoint: arrowStart,
        arrows: new Map(),
      };

      senderIndex.forEach((connector, receiverId) => {
        const shiftedConnector = connector.position.sub(curveGap);
        const points = [shiftedStart, shiftedConnector, connector.position];
        const connArrow: ConnectorArrow = { connector, points };

        arrow.arrows.set(receiverId, connArrow);
      });

      arrows.set(senderId, arrow);
    });

    return arrows;
  }

  // { senderId -> { receiverId -> SenderConnector }}}
  get senderConnectors(): SenderConnectors {
    const index: SenderConnectors = new Map();
    const senders: Map<string, Set<string>> = new Map();
    const connectorIndices: Map<string, number> = new Map();

    this.interactions.links.forEach((l: Link) => {
      const senderId = l.sourceId;
      const receiverId = l.destinationId;
      const apId = ids.accessPoint(receiverId, l.destinationPort);

      if (!index.has(senderId)) {
        index.set(senderId, new Map());
      }

      if (!senders.has(receiverId)) {
        senders.set(receiverId, new Set());
      }

      const sendersSet = senders.get(receiverId)!;
      sendersSet.add(senderId);

      const senderIndex = index.get(senderId)!;
      if (!senderIndex.has(receiverId)) {
        senderIndex.set(receiverId, {
          senderId,
          receiverId,
          apIds: new Set(),
          position: Vec2.from(0, 0),
        });
      }

      const connector = senderIndex.get(receiverId)!;
      connector.apIds.add(apId);
    });

    const connectorGap = sizes.distanceBetweenConnectors;

    index.forEach((senderIndex, senderId) => {
      senderIndex.forEach((connector, receiverId) => {
        const nsenders = senders.get(receiverId)!.size;
        const gutHeight = (nsenders - 1) * connectorGap;
        const idx = connectorIndices.get(receiverId) || 0;

        const midPoint = this.connectorMidPoints.get(receiverId);
        if (midPoint == null) return;

        const cardBBox = this.cardPlacement.get(receiverId)?.geometry;
        if (cardBBox == null) return;

        const position = midPoint.clone();
        position.y = midPoint.y - gutHeight / 2 + idx * connectorGap;
        position.x = cardBBox.x - sizes.connectorCardGap;

        connector.position = position;
        connectorIndices.set(receiverId, idx + 1);
      });
    });

    return index;
  }

  public defaultCardDims(): WH {
    return { w: sizes.endpointWidth, h: 0 };
  }

  get cardWH() {
    return (id: string): WH | undefined => {
      return this.cardDimensions.get(`service-${id}`);
    };
  }

  get cardHeight() {
    return (id: string): number => {
      const g = this.cardWH(id);

      return g ? g.h : 0;
    };
  }

  get endpointWidth() {
    return (id: string): number => {
      return sizes.endpointWidth;
    };
  }

  // TODO: can be a part of placement build
  get cardsBBox(): XYWH {
    const bbox = geom.xywh(Infinity, Infinity);

    this.placement.forEach((e: PlacementEntry) => {
      const { x, y, w, h } = e.geometry;

      bbox.x = Math.min(bbox.x, x);
      bbox.y = Math.min(bbox.y, y);

      // Temporarily store here maxX, maxY for a while
      bbox.w = Math.max(bbox.w, x + w);
      bbox.h = Math.max(bbox.h, y + h);
    });

    bbox.w -= bbox.x;
    bbox.h -= bbox.y;

    return bbox;
  }

  // { serviceId -> { apId -> Set<senderId> } }
  get cardAccessIndex(): Map<string, Map<string, Set<string>>> {
    const index = new Map();

    this.interactions.links.forEach((l: Link) => {
      const senderId = l.sourceId;
      const receiverId = l.destinationId;
      const apId = ids.accessPoint(receiverId, l.destinationPort);

      if (!index.has(receiverId)) {
        index.set(receiverId, new Map());
      }
      const cardIndex = index.get(receiverId)!;

      if (!cardIndex.has(apId)) {
        cardIndex.set(apId, new Set());
      }
      const apSenders = cardIndex.get(apId)!;

      apSenders.add(senderId);
    });

    return index;
  }

  // Gives mid of physical APs
  // { cardId -> Vec2 }
  get connectorMidPoints(): Map<string, Vec2> {
    const index = new Map();

    this.cardAccessIndex.forEach((cardIndex, cardId) => {
      let midPoint = Vec2.from(0, 0);
      let npoints = 0;

      cardIndex.forEach((_, apId: string) => {
        const apPos = this.apCoords.get(apId);
        if (apPos == null) return;

        midPoint = midPoint.add(apPos);
        npoints += 1;
      });

      if (npoints === 0) return;
      index.set(cardId, midPoint.mul(1 / npoints));
    });

    return index;
  }
}
