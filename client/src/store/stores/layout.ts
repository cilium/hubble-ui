import { action, computed, observable, reaction } from 'mobx';
import { dummy as geom, Vec2, WH, XYWH } from '~/domain/geometry';
import { ids } from '~/domain/ids';
import {
  ConnectorArrow,
  ConnectorPlacement,
  Placement,
  PlacementEntry,
  PlacementGrid,
  PlacementMeta,
  PlacementType,
  SenderArrows,
  SenderConnector,
} from '~/domain/layout';
import { ServiceCard } from '~/domain/service-card';
import { Link } from '~/domain/service-map';
import { sizes } from '~/ui/vars';
import InteractionStore from './interaction';
import ServiceStore from './service';

export type ConnectionIndex = Map<
  string,
  Map<string, Map<string, ConnectorPlacement>>
>;

// { receiverId -> (senderIds) }
export type IncomingConnections = Map<string, Set<string>>;

// { senderId   -> { receiverId -> connector } }
export type OutgoingConnections = Map<string, Map<string, SenderConnector>>;

export interface Connections {
  readonly outgoings: OutgoingConnections;
  readonly incomings: IncomingConnections;
}

export default class LayoutStore {
  @observable apCoords: Map<string, Vec2>; // { apId -> Vec2 }

  @observable private services: ServiceStore;
  @observable private interactions: InteractionStore;
  @observable private cardDimensions: Map<string, WH>;

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

  static defaultCardDims(): WH {
    return { w: sizes.endpointWidth, h: 0 };
  }

  @action.bound
  initUnitializedCards() {
    this.services.cards.forEach(card => {
      if (this.cardDimensions.has(card.id)) return;

      this.cardDimensions.set(card.id, LayoutStore.defaultCardDims());
    });
  }

  @action.bound
  setAPCoords(id: string, coords: Vec2) {
    this.apCoords.set(id, coords);
  }

  @action.bound
  setCardWH(id: string, props: WH) {
    this.cardDimensions.set(`service-${id}`, props);
  }

  @action.bound
  setCardHeight(id: string, height: number) {
    const dim = this.cardDimensions.get(id) || LayoutStore.defaultCardDims();
    const updated = Object.assign({}, dim, { h: height });

    this.cardDimensions.set(id, updated);
  }

  @computed get cardsPlacement(): Map<string, PlacementEntry> {
    const egress = this.createGrid(
      PlacementType.EGRESS_TO_OUTSIDE_NAMESPACE,
      0,
      0,
    );

    const ingress = this.createGrid(
      PlacementType.INGRESS_FROM_OUTSIDE_NAMESPACE,
      0,
      egress.y + egress.height + sizes.endpointVPadding,
    );

    const nsWithConns = this.createGrid(
      PlacementType.NAMESPACED_WITH_CONNECTIONS,
      ingress.x + ingress.width + sizes.endpointHPadding,
      egress.y + egress.height + sizes.endpointVPadding,
    );

    const nsWithoutConns = this.createGrid(
      PlacementType.NAMESPACED_WITHOUT_CONNECTIONS,
      nsWithConns.x + nsWithConns.width + sizes.endpointHPadding,
      egress.y + egress.height + sizes.endpointVPadding,
    );

    this.alignGrid(nsWithConns, ingress, 'y');
    this.alignGrid(nsWithConns, nsWithoutConns, 'y');
    this.alignGrid(nsWithConns, egress, 'x');

    return new Map([
      ...egress.placement,
      ...ingress.placement,
      ...nsWithConns.placement,
      ...nsWithoutConns.placement,
    ]);
  }

  @computed get placement(): Placement {
    return [...this.cardsPlacement.values()];
  }

  // { senderId -> SenderArrows }
  // SenderArrows: { senderId, startPoint, arrows: { receiverId -> Connector }}
  @computed get connectionArrows(): Map<string, SenderArrows> {
    const arrows: Map<string, SenderArrows> = new Map();
    const curveGap = Vec2.from(sizes.connectorCardGap, 0);

    this.connections.outgoings.forEach((senderIndex, senderId) => {
      const senderPlacement = this.cardsPlacement.get(senderId)?.geometry;
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

  @computed get connections(): Connections {
    const { outgoings, incomings } = this.logicalConnections;

    const connectorIndices: Map<string, number> = new Map();
    const connectorGap = sizes.distanceBetweenConnectors;

    outgoings.forEach(senderIndex => {
      senderIndex.forEach((connector, receiverId) => {
        const receivers = incomings.get(receiverId);
        if (receivers == null) return;

        const nReceivers = receivers.size;
        const gutHeight = (nReceivers - 1) * connectorGap;
        const idx = connectorIndices.get(receiverId) || 0;

        const midPoint = this.connectorMidPoints.get(receiverId);
        if (midPoint == null) return;

        const cardBBox = this.cardsPlacement.get(receiverId)?.geometry;
        if (cardBBox == null) return;

        const position = midPoint.clone();
        position.y = midPoint.y - gutHeight / 2 + idx * connectorGap;
        position.x = cardBBox.x - sizes.connectorCardGap;

        connector.position = position;
        connectorIndices.set(receiverId, idx + 1);
      });
    });

    return { outgoings, incomings };
  }

  @computed get cardWH() {
    return (id: string): WH | undefined => {
      return this.cardDimensions.get(`service-${id}`);
    };
  }

  @computed get cardHeight() {
    return (id: string): number => {
      const g = this.cardWH(id);

      return g ? g.h : 0;
    };
  }

  @computed get endpointWidth() {
    return (id: string): number => {
      return sizes.endpointWidth;
    };
  }

  // TODO: can be a part of placement build
  @computed get cardsBBox(): XYWH {
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
  @computed get cardAccessIndex(): Map<string, Map<string, Set<string>>> {
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
  @computed get connectorMidPoints(): Map<string, Vec2> {
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

  @computed private get logicalConnections(): Connections {
    const outgoings: OutgoingConnections = new Map();
    const incomings: IncomingConnections = new Map();

    this.interactions.links.forEach((l: Link) => {
      const senderId = l.sourceId;
      const receiverId = l.destinationId;
      const apId = ids.accessPoint(receiverId, l.destinationPort);

      if (!outgoings.has(senderId)) {
        outgoings.set(senderId, new Map());
      }

      if (!incomings.has(receiverId)) {
        incomings.set(receiverId, new Set());
      }

      const receivers = incomings.get(receiverId)!;
      receivers.add(senderId);

      const senders = outgoings.get(senderId)!;
      if (!senders.has(receiverId)) {
        senders.set(receiverId, {
          senderId,
          receiverId,
          apIds: new Set(),
          position: Vec2.from(0, 0),
        });
      }

      const connector = senders.get(receiverId)!;
      connector.apIds.add(apId);
    });

    return { outgoings, incomings };
  }

  @computed private get placementMetas() {
    const index: Map<PlacementType, Set<PlacementMeta>> = new Map();

    this.services.cards.forEach((card: ServiceCard) => {
      const placementInfo = this.findPlacementMetaForCard(card);
      const cards = (index.get(placementInfo.position) ?? new Set()).add(
        placementInfo,
      );
      index.set(placementInfo.position, cards);
    });

    return index;
  }

  private findPlacementMetaForCard(card: ServiceCard): PlacementMeta {
    const {
      incomingsCnt,
      hasWorldOrHostAsSender,
    } = this.processIncomingConnectionsForCard(card);

    const {
      outgoingsCnt,
      hasWorldAsReceiver,
    } = this.processOutgoingConnectionsForCard(card);

    let type = PlacementType.NAMESPACED_WITHOUT_CONNECTIONS;
    if (card.isHost) {
      type = PlacementType.INGRESS_FROM_OUTSIDE_NAMESPACE;
    } else if (card.isWorld) {
      if (incomingsCnt > 0) {
        type = PlacementType.EGRESS_TO_OUTSIDE_NAMESPACE;
      } else {
        type = PlacementType.INGRESS_FROM_OUTSIDE_NAMESPACE;
      }
    } else if (incomingsCnt > 0 || outgoingsCnt > 0) {
      type = PlacementType.NAMESPACED_WITH_CONNECTIONS;
    }

    let weight = outgoingsCnt + incomingsCnt;
    if (hasWorldOrHostAsSender) {
      weight += 1000;
    }
    if (hasWorldAsReceiver) {
      weight += 500;
    }

    return {
      position: type,
      card,
      weight,
      incomingsCnt,
      outgoingsCnt,
      hasWorldOrHostAsSender,
      hasWorldAsReceiver,
    };
  }

  private processIncomingConnectionsForCard(card: ServiceCard) {
    const senders = this.logicalConnections.incomings.get(card.id);
    if (senders == null) {
      return {
        hasWorldOrHostAsSender: false,
        incomingsCnt: 0,
      };
    }

    let hasWorldOrHostAsSender = false;
    senders.forEach(senderId => {
      const senderCard = this.services.cardsMap.get(senderId);
      if (senderCard == null) return;

      if (senderCard.isWorld || senderCard.isHost) {
        hasWorldOrHostAsSender = true;
        return;
      }
    });

    return {
      hasWorldOrHostAsSender,
      incomingsCnt: senders.size,
    };
  }

  private processOutgoingConnectionsForCard(card: ServiceCard) {
    const receivers = this.logicalConnections.outgoings.get(card.id);
    if (!receivers) {
      return {
        outgoingsCnt: 0,
        hasWorldAsReceiver: false,
      };
    }

    let hasWorldAsReceiver = false;
    receivers.forEach(connector => {
      const receiverCard = this.services.cardsMap.get(connector.receiverId);
      if (receiverCard == null) return;

      if (receiverCard.isWorld) {
        hasWorldAsReceiver = true;
        return;
      }
    });

    return {
      outgoingsCnt: receivers.size,
      hasWorldAsReceiver,
    };
  }

  private createGrid(type: PlacementType, x: number, y: number): PlacementGrid {
    const placement: Map<string, PlacementEntry> = new Map();
    let maxX = 0;
    let maxY = 0;

    const metas = this.placementMetas.get(type) ?? new Set();
    const columnLimit = Math.ceil(Math.sqrt(metas.size));

    let cardsInColumn = 1;
    let columnIdx = 0;
    let curX = x;
    let curY = y;

    // column idx -> column height
    const columnsHeights = new Map<number, number>();

    const metasArr = Array.from(metas).sort((a, b) => b.weight - a.weight);

    // first pass to place cards in columns
    metasArr.forEach((meta, metaIdx, arr) => {
      const dims = this.cardDimensions.get(meta.card.id);
      if (dims == null) return;

      placement.set(meta.card.id, {
        ...meta,
        column: columnIdx,
        geometry: XYWH.empty()
          .setWH(dims)
          .setXY(curX, curY),
      });

      const lastInColumn = cardsInColumn % columnLimit === 0;
      const isLast = metaIdx + 1 === metas.size;
      const nextWeightIsDifferent = arr[metaIdx + 1]?.weight !== meta.weight;

      // move to next column
      if (isLast || lastInColumn || nextWeightIsDifferent) {
        columnsHeights.set(columnIdx++, curY + dims.h);

        curX += dims.w;
        if (curX > maxX) maxX = curX;
        curX += sizes.endpointHPadding;
        if (isLast && curY + dims.h > maxY) {
          maxY = curY + dims.h;
        } else {
          curY = y;
        }

        cardsInColumn = 1;
        // stay in current column
      } else {
        curY += dims.h;
        if (curY > maxY) maxY = curY;
        curY += sizes.endpointVPadding;
        cardsInColumn++;
      }
    });

    // second pass to align cards vertically
    metasArr.forEach(meta => {
      const place = placement.get(meta.card.id);
      if (place == null) return;

      const columnHeight = columnsHeights.get(place.column);
      if (typeof columnHeight !== 'number') return;

      const diff = maxY - columnHeight;
      const offset = diff / 2;
      place.geometry = place.geometry.setXY(
        place.geometry.x,
        place.geometry.y + offset,
      );
    });

    return { placement, x, y, width: maxX - x, height: maxY - y };
  }

  private alignGrid(
    baseGrid: PlacementGrid,
    gridToAlign: PlacementGrid,
    axis: 'x' | 'y',
  ) {
    const dim = axis === 'x' ? 'width' : 'height';

    const offsetAxis = (baseGrid[axis] - gridToAlign[axis]) / 2;
    const offsetDim = (baseGrid[dim] - gridToAlign[dim]) / 2;
    const offset = offsetAxis + offsetDim;

    gridToAlign[axis] = baseGrid[axis] + offset;
    gridToAlign.placement.forEach(place => {
      place.geometry = place.geometry.setXY(
        place.geometry.x + (axis === 'x' ? offset : 0),
        place.geometry.y + (axis === 'y' ? offset : 0),
      );
    });
  }
}
