import { action, computed, observable, reaction } from 'mobx';
import _ from 'lodash';

import { dummy as geom, Vec2, XY, WH, XYWH } from '~/domain/geometry';
import { ids } from '~/domain/ids';
import {
  ConnectorArrow,
  Placement,
  PlacementEntry,
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

export type CardsPlacement = Map<string, PlacementEntry>;
export type CardsColumns = Map<string, PlacementMeta[][]>;

export interface Connections {
  readonly outgoings: ConnectionsMap;
  readonly incomings: ConnectionsMap;
}

type PlacementFilter = (e: PlacementEntry) => boolean;

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
  get cardsPlacement(): CardsPlacement {
    const groups = this.placementGroups;
    const columns: Map<string, PlacementMeta[][]> = new Map();

    groups.forEach((placements: Set<PlacementMeta>, kind: PlacementKind) => {
      const kindColumns = this.buildPlacementColumns(placements);

      columns.set(kind, kindColumns);
    });

    const placement = this.assignCoordinates(columns);
    return placement;
  }

  private assignCoordinates(columns: CardsColumns): CardsPlacement {
    const placement: CardsPlacement = new Map();

    // prettier-ignore
    const top = this.alignColumns(columns, [ PlacementKind.EgressToOutside ]);
    const bottom = this.alignColumns(columns, [
      PlacementKind.IngressFromOutside,
      PlacementKind.InsideWithConnections,
      PlacementKind.InsideWithoutConnections,
    ]);

    const egressToOutside = top.get(PlacementKind.EgressToOutside);
    const ingressFromOutside = bottom.get(PlacementKind.IngressFromOutside);
    const insideWithConns = bottom.get(PlacementKind.InsideWithConnections);
    const insideNoConns = bottom.get(PlacementKind.InsideWithoutConnections);

    const shiftEntries = (shift: XY, entries: PlacementEntry[]) => {
      entries.forEach((entry: PlacementEntry) => {
        entry.geometry.x += shift.x;
        entry.geometry.y += shift.y;
      });
    };

    // EgressToOutside cards aligned to middle of InsideWithConnections cards
    if (insideWithConns != null && egressToOutside != null) {
      const outsideBBox = egressToOutside[1];
      const insideBBox = insideWithConns[1];

      const newOutsideBBoxX = (insideBBox.w - outsideBBox.w) / 2;
      const x = (insideBBox.x - outsideBBox.x) / 2 + newOutsideBBoxX;

      shiftEntries({ x, y: 0 }, egressToOutside[0]);
    }

    if (egressToOutside != null) {
      // Shift all other cards below EgressToOutside cards
      const bottomShift = {
        x: 0,
        y: egressToOutside[1].h + sizes.endpointVPadding,
      };

      // prettier-ignore
      ingressFromOutside && shiftEntries(bottomShift, ingressFromOutside[0]);
      insideWithConns && shiftEntries(bottomShift, insideWithConns[0]);
      insideNoConns && shiftEntries(bottomShift, insideNoConns[0]);
    }

    const copyEntries = (entries: PlacementEntry[]) => {
      entries.forEach(entry => {
        placement.set(entry.card.id, entry);
      });
    };

    egressToOutside && copyEntries(egressToOutside[0]);
    ingressFromOutside && copyEntries(ingressFromOutside[0]);
    insideWithConns && copyEntries(insideWithConns[0]);
    insideNoConns && copyEntries(insideNoConns[0]);

    return placement;
  }

  private alignColumns(
    cardsColumns: CardsColumns,
    kinds: PlacementKind[],
  ): Map<PlacementKind, [PlacementEntry[], XYWH]> {
    const alignment = new Map();

    const columnHeights: Map<PlacementEntry[], number> = new Map();
    const offset = { x: 0, y: 0 };
    let entireHeight = 0;

    kinds.forEach(kind => {
      const columns = cardsColumns.get(kind);
      if (columns == null) return;

      const entries: PlacementEntry[] = [];
      const bbox = XYWH.fromArgs(offset.x, offset.y, 0, 0);

      columns.forEach((column: PlacementMeta[]) => {
        const columnEntries: PlacementEntry[] = [];

        let columnWidth = 0;
        let columnHeight = 0;
        offset.y = 0;

        column.forEach((meta: PlacementMeta, ri: number) => {
          const cardWH = this.cardDimensions.get(meta.card.id);
          if (cardWH == null) return;

          const geomtry = XYWH.fromArgs(offset.x, offset.y, cardWH.w, cardWH.h);

          const entry = {
            card: meta.card,
            kind: meta.kind,
            geometry: geomtry,
          };

          entries.push(entry);
          columnEntries.push(entry);

          columnWidth = Math.max(columnWidth, cardWH.w);
          columnHeight += cardWH.h + (ri === 0 ? 0 : sizes.endpointVPadding);

          offset.y += cardWH.h + sizes.endpointVPadding;
        });

        columnHeights.set(columnEntries, columnHeight);

        offset.x += columnWidth + sizes.endpointHPadding;

        bbox.w = Math.max(bbox.w, offset.x - sizes.endpointHPadding);
        bbox.h = Math.max(bbox.h, offset.y - sizes.endpointVPadding);

        entireHeight = Math.max(entireHeight, bbox.h);
      });

      alignment.set(kind, [entries, bbox]);
    });

    columnHeights.forEach((columnHeight: number, entries: PlacementEntry[]) => {
      if (entries.length === 0) return;

      const kind = entries[0].kind;
      const [_, bbox] = alignment.get(kind)!;

      const verticalOffset = (entireHeight - columnHeight) / 2;

      entries.forEach(entry => {
        entry.geometry.y += verticalOffset;
      });
    });

    return alignment;
  }

  private buildPlacementColumns(plcs: Set<PlacementMeta>): PlacementMeta[][] {
    // Heaviest cards go first
    const sorted = Array.from(plcs).sort((a, b) => b.weight - a.weight);

    // Make columns to be more like square
    const maxCardsInColumn = Math.ceil(Math.sqrt(plcs.size));

    const columns: PlacementMeta[][] = [];
    let curColumn: PlacementMeta[] = [];
    let curWeight: number | null = null;

    const flushColumn = () => {
      columns.push(curColumn);
      curColumn = [];
    };

    sorted.forEach((plc: PlacementMeta, i: number) => {
      const maxCardsReached = curColumn.length >= maxCardsInColumn;
      const weightChanged = curWeight != null && plc.weight !== curWeight;

      if (maxCardsReached || weightChanged) flushColumn();

      curWeight = plc.weight;
      curColumn.push(plc);

      if (i === sorted.length - 1) flushColumn();
    });

    return columns;
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

    // Weight determines how many connections the card has.
    // If card has special interactions, it gains more weight.
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

    // prettier-ignore
    senders != null && senders.forEach((_, senderId) => {
      const sender = this.services.cardsMap.get(senderId);
      if (sender == null) return;

      hasWorldAsSender = hasWorldAsSender || sender.isWorld;
      hasHostAsSender = hasHostAsSender || sender.isHost;
    });

    // prettier-ignore
    receivers != null && receivers.forEach((_, receiverId) => {
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

  private placementBBox(filterFn: PlacementFilter = _.identity) {
    const bbox = geom.xywh(Infinity, Infinity);

    this.placement.forEach((e: PlacementEntry) => {
      if (!filterFn(e)) return;

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

  @computed
  get cardsBBox(): XYWH {
    return this.placementBBox();
  }

  @computed
  get nsCardsBBox(): XYWH {
    return this.placementBBox(e => {
      const one = e.kind === PlacementKind.InsideWithConnections;
      const two = e.kind === PlacementKind.InsideWithoutConnections;

      return one || two;
    });
  }

  // Gives mid of physical APs
  // { cardId -> Vec2 }
  @computed
  get connectorMidPoints(): Map<string, Vec2> {
    const index = new Map();

    this.connections.incomings.forEach((receiverIndex, receiverId) => {
      let midPoint = Vec2.from(0, 0);
      let npoints = 0;

      // TODO: would be cool to be able to fetch it from service card
      // WARN: it could be a strange architecture
      let receiverAPs: Set<string> = new Set();

      receiverIndex.forEach((apIds: Set<string>) => {
        apIds.forEach((apId: string) => {
          receiverAPs = new Set([...receiverAPs, ...apIds]);
        });
      });

      receiverAPs.forEach((apId: string) => {
        const apPos = this.apCoords.get(apId);
        if (apPos == null) return;

        midPoint = midPoint.add(apPos);
        npoints += 1;
      });

      if (npoints === 0) return;
      index.set(receiverId, midPoint.mul(1 / npoints));
    });

    return index;
  }
}
