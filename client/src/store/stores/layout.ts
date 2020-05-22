import { action, computed, observable, reaction } from 'mobx';
import { dummy as geom, Vec2, WH, XYWH } from '~/domain/geometry';
import { ids } from '~/domain/ids';
import {
  ConnectorArrow,
  Placement,
  PlacementEntry,
  PlacementGrid,
  PlacementMeta,
  PlacementKind,
  SenderArrows,
  ServiceConnector,
} from '~/domain/layout';
import { ServiceCard } from '~/domain/service-card';
import { Link } from '~/domain/service-map';
import { sizes } from '~/ui/vars';
import InteractionStore from './interaction';
import ServiceStore from './service';

// { cardId -> { cardId -> Set(apIds) } }
export type ConnectionsMap = Map<string, Map<string, Set<string>>>;

// { senderId -> { receiverId -> ServiceConnector } }
export type Connectors = Map<string, Map<string, ServiceConnector>>;

export interface Connections {
  readonly outgoings: ConnectionsMap;
  readonly incomings: ConnectionsMap;
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

  @computed
  get cardsPlacement(): Map<string, PlacementEntry> {
    const groups = this.placementGroups;

    console.log('placement groups: ', groups);

    return new Map();

    // const egress = this.createGrid(
    //   PlacementKind.EGRESS_TO_OUTSIDE_NAMESPACE,
    //   0,
    //   0,
    // );

    // const ingress = this.createGrid(
    //   PlacementKind.INGRESS_FROM_OUTSIDE_NAMESPACE,
    //   0,
    //   egress.y + egress.height + sizes.endpointVPadding,
    // );

    // const nsWithConns = this.createGrid(
    //   PlacementKind.NAMESPACED_WITH_CONNECTIONS,
    //   ingress.x + ingress.width + sizes.endpointHPadding,
    //   egress.y + egress.height + sizes.endpointVPadding,
    // );

    // const nsWithoutConns = this.createGrid(
    //   PlacementKind.NAMESPACED_WITHOUT_CONNECTIONS,
    //   nsWithConns.x + nsWithConns.width + sizes.endpointHPadding,
    //   egress.y + egress.height + sizes.endpointVPadding,
    // );

    // this.alignGrid(nsWithConns, ingress, 'y');
    // this.alignGrid(nsWithConns, nsWithoutConns, 'y');
    // this.alignGrid(nsWithConns, egress, 'x');

    // return new Map([
    //   ...egress.placement,
    //   ...ingress.placement,
    //   ...nsWithConns.placement,
    //   ...nsWithoutConns.placement,
    // ]);
  }

  @computed
  private get placementGroups() {
    const index: Map<PlacementKind, Set<PlacementMeta>> = new Map();

    this.services.cards.forEach((card: ServiceCard) => {
      const meta = this.getCardPlacementMeta(card);
      const kindSet = index.get(meta.kind) ?? new Set();
      const cards = kindSet.add(meta);

      index.set(meta.kind, cards);
    });

    return index;
  }

  private getCardPlacementMeta(card: ServiceCard): PlacementMeta {
    const senders = this.connections.incomings.get(card.id);
    const receivers = this.connections.outgoings.get(card.id);

    const incomingsCount = senders?.size || 0;
    const outgoingsCount = receivers?.size || 0;

    // TODO: cache this ?
    const props = this.findSpecialInteractions(card);

    let kind = PlacementKind.InsideWithoutConnections;
    if (card.isHost) {
      kind = PlacementKind.IngressFromOutside;
    } else if (card.isWorld) {
      kind = PlacementKind.IngressFromOutside;
      kind = incomingsCount > 0 ? PlacementKind.EgressToOutside : kind;
    } else if (incomingsCount > 0 || outgoingsCount > 0) {
      kind = PlacementKind.InsideWithConnections;
    }

    let weight = incomingsCount + outgoingsCount;

    weight += props.hasWorldAsSender || props.hasHostAsSender ? 1000 : 0;
    weight += props.hasWorldAsReceiver ? 500 : 0;

    return {
      kind,
      card,
      weight,
    };
  }

  private findSpecialInteractions(card: ServiceCard) {
    const senders = this.connections.incomings.get(card.id);
    const receivers = this.connections.outgoings.get(card.id);

    let hasWorldAsSender = false;
    let hasHostAsSender = false;
    let hasWorldAsReceiver = false;

    senders != null &&
      senders.forEach((_, senderId) => {
        const sender = this.services.cardsMap.get(senderId);
        if (sender == null) return;

        hasWorldAsSender = hasWorldAsSender || sender.isWorld;
        hasHostAsSender = hasHostAsSender || sender.isHost;
      });

    receivers != null &&
      receivers.forEach((_, receiverId) => {
        const receiver = this.services.cardsMap.get(receiverId);
        if (receiver == null) return;

        hasWorldAsReceiver = hasWorldAsReceiver || receiver.isWorld;
      });

    return {
      hasWorldAsReceiver,
      hasWorldAsSender,
      hasHostAsSender,
    };
  }

  @computed
  get placement(): Placement {
    return [...this.cardsPlacement.values()];
  }

  // { senderId -> SenderArrows }
  // SenderArrows: { senderId, startPoint, arrows: { receiverId -> Connector }}
  @computed
  get connectionArrows(): Map<string, SenderArrows> {
    const arrows: Map<string, SenderArrows> = new Map();
    const curveGap = Vec2.from(sizes.connectorCardGap, 0);

    this.connectors.forEach((senderIndex, senderId) => {
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

  @computed
  get connectors(): Connectors {
    // Connectors gives geometry information about where connector is located.
    // It also gives secondary information about which APs are accessed

    const index = new Map();
    const connectorIndices: Map<string, number> = new Map();
    const connectorGap = sizes.distanceBetweenConnectors;

    this.connections.outgoings.forEach((senderIndex, senderId) => {
      if (!index.has(senderId)) {
        index.set(senderId, new Map());
      }

      senderIndex.forEach((apIds, receiverId) => {
        const receivers = this.connections.incomings.get(receiverId);
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

        const connector: ServiceConnector = {
          senderId,
          receiverId,
          apIds,
          position,
        };

        index.get(senderId)!.set(receiverId, connector);
        connectorIndices.set(receiverId, idx + 1);
      });
    });

    return index;
  }

  @computed
  get connections(): Connections {
    // Connections only gives information about what services are connected
    // and by which access point (apId), it doesnt provide geometry information
    //
    // outgoings: { senderId -> { receiverId -> Set(apIds) } }
    //                   apIds sets are equal --> ||
    // incomings: { receiverId -> { senderId -> Set(apIds) } }

    const outgoings: ConnectionsMap = new Map();
    const incomings: ConnectionsMap = new Map();

    this.interactions.links.forEach((l: Link) => {
      const senderId = l.sourceId;
      const receiverId = l.destinationId;
      const apId = ids.accessPoint(receiverId, l.destinationPort);

      // Outgoing connection setup
      if (!outgoings.has(senderId)) {
        outgoings.set(senderId, new Map());
      }

      const sentTo = outgoings.get(senderId)!;
      if (!sentTo.has(receiverId)) {
        sentTo.set(receiverId, new Set());
      }

      const sentToApIds = sentTo.get(receiverId)!;
      sentToApIds.add(apId);

      // Incoming connection setup
      if (!incomings.has(receiverId)) {
        incomings.set(receiverId, new Map());
      }

      const receivedFrom = incomings.get(receiverId)!;
      if (!receivedFrom.has(senderId)) {
        receivedFrom.set(senderId, new Set());
      }

      const receivedToApIds = receivedFrom.get(senderId)!;
      receivedToApIds.add(apId);
    });

    return { outgoings, incomings };
  }

  @computed
  get cardWH() {
    return (id: string): WH | undefined => {
      return this.cardDimensions.get(`service-${id}`);
    };
  }

  @computed
  get cardHeight() {
    return (id: string): number => {
      const g = this.cardWH(id);

      return g ? g.h : 0;
    };
  }

  @computed
  get endpointWidth() {
    return (id: string): number => {
      return sizes.endpointWidth;
    };
  }

  // TODO: can be a part of placement build
  @computed
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
  @computed
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
  @computed
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

  // private createGrid(type: PlacementKind, x: number, y: number): PlacementGrid {
  //   console.log(`creating grid for type: ${type}, x: ${x}, y: ${y}`);

  //   const placement: Map<string, PlacementEntry> = new Map();
  //   let maxX = 0;
  //   let maxY = 0;

  //   const metas = this.placementMetas.get(type) ?? new Set();
  //   const columnLimit = Math.ceil(Math.sqrt(metas.size));

  //   let cardsInColumn = 1;
  //   let columnIdx = 0;
  //   let curX = x;
  //   let curY = y;

  //   // column idx -> column height
  //   const columnsHeights = new Map<number, number>();

  //   const metasArr = Array.from(metas).sort((a, b) => b.weight - a.weight);

  //   // first pass to place cards in columns
  //   metasArr.forEach((meta, metaIdx, arr) => {
  //     const dims = this.cardDimensions.get(meta.card.id);
  //     if (dims == null) return;

  //     placement.set(meta.card.id, {
  //       ...meta,
  //       column: columnIdx,
  //       geometry: XYWH.empty()
  //         .setWH(dims)
  //         .setXY(curX, curY),
  //     });

  //     const lastInColumn = cardsInColumn % columnLimit === 0;
  //     const isLast = metaIdx + 1 === metas.size;
  //     const nextWeightIsDifferent = arr[metaIdx + 1]?.weight !== meta.weight;

  //     console.log(`lastInColumn: ${lastInColumn}, isLast: ${isLast}, nextWeightIsDifferent: ${nextWeightIsDifferent}`);
  //     console.log(`card: `, meta.card.caption, meta.card.id);

  //     if (isLast || lastInColumn || nextWeightIsDifferent) {
  //       // move to next column
  //       columnsHeights.set(columnIdx, curY + dims.h);

  //       curX += dims.w;
  //       maxX = Math.max(maxX, curX);

  //       curX += sizes.endpointHPadding;

  //       if (isLast && curY + dims.h > maxY) {
  //         maxY = curY + dims.h;
  //       } else {
  //         curY = y;
  //       }

  //       cardsInColumn = 1;
  //       columnIdx += 1;
  //     } else {
  //       // stay in current column
  //       curY += dims.h;;
  //       maxY = Math.max(maxY, curY);

  //       curY += sizes.endpointVPadding;
  //       cardsInColumn++;
  //     }
  //   });

  //   // second pass to align cards vertically
  //   metasArr.forEach(meta => {
  //     const place = placement.get(meta.card.id);
  //     if (place == null) return;

  //     const columnHeight = columnsHeights.get(place.column);
  //     if (typeof columnHeight !== 'number') return;

  //     const diff = maxY - columnHeight;
  //     const offset = diff / 2;
  //     place.geometry = place.geometry.setXY(
  //       place.geometry.x,
  //       place.geometry.y + offset,
  //     );
  //   });

  //   return { placement, x, y, width: maxX - x, height: maxY - y };
  // }

  // private alignGrid(
  //   baseGrid: PlacementGrid,
  //   gridToAlign: PlacementGrid,
  //   axis: 'x' | 'y',
  // ) {
  //   const dim = axis === 'x' ? 'width' : 'height';

  //   const offsetAxis = (baseGrid[axis] - gridToAlign[axis]) / 2;
  //   const offsetDim = (baseGrid[dim] - gridToAlign[dim]) / 2;
  //   const offset = offsetAxis + offsetDim;

  //   gridToAlign[axis] = baseGrid[axis] + offset;
  //   gridToAlign.placement.forEach(place => {
  //     place.geometry = place.geometry.setXY(
  //       place.geometry.x + (axis === 'x' ? offset : 0),
  //       place.geometry.y + (axis === 'y' ? offset : 0),
  //     );
  //   });
  // }
}
