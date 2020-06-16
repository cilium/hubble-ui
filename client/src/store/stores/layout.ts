import { action, computed, observable, reaction, autorun } from 'mobx';
import _ from 'lodash';

import { ids } from '~/domain/ids';
import { dummy as geom, Vec2, XY, WH, XYWH, rounding } from '~/domain/geometry';
import { ServiceCard } from '~/domain/service-card';
import { Link } from '~/domain/service-map';
import {
  ConnectorArrow,
  Placement,
  PlacementEntry,
  PlacementMeta,
  PlacementKind,
  EntriesGroup,
  SenderArrows,
  ServiceConnector,
} from '~/domain/layout';

import InteractionStore from './interaction';
import ServiceStore from './service';
import ControlStore from './controls';

import { sizes } from '~/ui/vars';
// { senderId -> { receiverId -> ServiceConnector } }
export type Connectors = Map<string, Map<string, ServiceConnector>>;

export type CardsPlacement = Map<string, PlacementEntry>;
export type CardsColumns = Map<string, PlacementMeta[][]>;

type PlacementFilter = (e: PlacementEntry) => boolean;

export default class LayoutStore {
  @observable accessPointsCoords: Map<string, Vec2>; // { apId -> Vec2 }

  @observable private services: ServiceStore;
  @observable private interactions: InteractionStore;
  @observable private controls: ControlStore;
  @observable private cardDimensions: Map<string, WH>;

  constructor(
    services: ServiceStore,
    interactions: InteractionStore,
    controls: ControlStore,
  ) {
    this.services = services;
    this.interactions = interactions;
    this.controls = controls;

    this.cardDimensions = new Map();
    this.accessPointsCoords = new Map();

    reaction(
      () => this.services.data,
      () => {
        this.initUnitializedCards();
      },
    );
  }

  static defaultCardDims(): WH {
    return { w: sizes.endpointWidth, h: 0 };
  }

  @action.bound
  clear() {
    this.accessPointsCoords.clear();
    this.cardDimensions.clear();
  }

  @action.bound
  initUnitializedCards() {
    console.log('in initUnitializedCards');
    this.services.cards.forEach(card => {
      if (this.cardDimensions.has(card.id)) return;

      this.cardDimensions.set(card.id, LayoutStore.defaultCardDims());
    });
  }

  @action.bound
  setAPCoords(id: string, coords: Vec2) {
    this.accessPointsCoords.set(id, coords);
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
  get placement(): Placement {
    return [...this.cardsPlacement.values()];
  }

  @computed
  get cardsPlacement(): CardsPlacement {
    const groups = this.placementGroups;
    const columns: Map<string, PlacementMeta[][]> = new Map();
    const skipAnotherNs = !this.controls.showCrossNamespaceActivity;

    groups.forEach((placements: Set<PlacementMeta>, kind: PlacementKind) => {
      if (skipAnotherNs && kind === PlacementKind.AnotherNamespace) return;

      const kindColumns = this.buildPlacementColumns(placements);
      columns.set(kind, kindColumns);
    });

    const placement = this.assignCoordinates(columns);
    return placement;
  }

  @computed
  private get placementGroups() {
    const index: Map<PlacementKind, Set<PlacementMeta>> = new Map();
    const currentNs = this.controls.currentNamespace;

    this.services.cards.forEach((card: ServiceCard) => {
      const meta = this.getCardPlacementMeta(card, currentNs || undefined);
      const kindSet = index.get(meta.kind) ?? new Set();
      const cards = kindSet.add(meta);

      index.set(meta.kind, cards);
    });

    return index;
  }

  private getCardPlacementMeta(card: ServiceCard, ns?: string): PlacementMeta {
    const senders = this.connections.incomings.get(card.id);
    const receivers = this.connections.outgoings.get(card.id);

    const incomingsCount = senders?.size || 0;
    const outgoingsCount = receivers?.size || 0;

    // TODO: cache this ?
    const props = this.findSpecialInteractions(card);

    let kind = PlacementKind.InsideWithoutConnections;
    if (card.isHost || card.isRemoteNode) {
      kind = PlacementKind.FromWorld;
    } else if (card.isWorld) {
      kind = PlacementKind.FromWorld;
      kind = incomingsCount > 0 ? PlacementKind.ToWorld : kind;
    } else if (ns != null && card.namespace !== ns) {
      kind = PlacementKind.AnotherNamespace;
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

  private assignCoordinates(columns: CardsColumns): CardsPlacement {
    const placement: CardsPlacement = new Map();

    // prettier-ignore
    const top = this.alignColumns(columns, [
      PlacementKind.ToWorld,
    ]);

    // prettier-ignore
    const middle = this.alignColumns(columns, [
      PlacementKind.FromWorld,
      PlacementKind.InsideWithConnections,
      PlacementKind.InsideWithoutConnections,
    ]);

    // prettier-ignore
    const bottom = this.alignColumns(columns, [
      PlacementKind.AnotherNamespace,
    ]);

    const toOutside = top.get(PlacementKind.ToWorld);
    const fromOutside = middle.get(PlacementKind.FromWorld);
    const insideWithConns = middle.get(PlacementKind.InsideWithConnections);
    const insideNoConns = middle.get(PlacementKind.InsideWithoutConnections);
    const anotherNs = bottom.get(PlacementKind.AnotherNamespace);

    const shiftEntries = (shift: XY, entries: PlacementEntry[]) => {
      entries.forEach((entry: PlacementEntry) => {
        entry.geometry.x += shift.x;
        entry.geometry.y += shift.y;
      });
    };

    const shiftToInsideCenter = (bbox: XYWH): XY => {
      const insideBBox = insideWithConns!.bbox;

      const relativeOffset = insideBBox.x - bbox.x;
      const bboxDiff = (insideBBox.w - bbox.w) / 2;
      const x = relativeOffset + bboxDiff;

      return { x, y: 0 };
    };

    // ToWorld cards aligned to middle of InsideWithConnections cards
    if (insideWithConns != null && toOutside != null) {
      shiftEntries(shiftToInsideCenter(toOutside.bbox), toOutside.entries);
    }

    if (toOutside != null) {
      // Shift all other cards below ToWorld cards
      const middleShift = {
        x: 0,
        y: toOutside.bbox.h + sizes.endpointVPadding,
      };

      // prettier-ignore
      fromOutside && shiftEntries(middleShift, fromOutside.entries);
      insideWithConns && shiftEntries(middleShift, insideWithConns.entries);
      insideNoConns && shiftEntries(middleShift, insideNoConns.entries);
    }

    const buildShiftForBottom = (): XY => {
      const shift = { x: 0, y: 0 };

      if (toOutside != null) {
        shift.y += toOutside.bbox.h + sizes.endpointVPadding;
      }

      let middleHeight = 0;
      if (fromOutside != null) {
        middleHeight = Math.max(middleHeight, fromOutside.bbox.h);
      }

      if (insideWithConns != null) {
        middleHeight = Math.max(middleHeight, insideWithConns.bbox.h);
      }

      if (insideNoConns != null) {
        middleHeight = Math.max(middleHeight, insideNoConns.bbox.h);
      }

      if (middleHeight > Number.EPSILON) {
        shift.y += middleHeight + sizes.endpointVPadding;
      }

      if (insideWithConns != null) {
        const insideShift = shiftToInsideCenter(anotherNs!.bbox);
        shift.x = insideShift.x;
      }

      return shift;
    };

    if (anotherNs != null) {
      // Shift card from another namespace below others
      const shift = buildShiftForBottom();
      shiftEntries(shift, anotherNs.entries);
    }

    const copyEntries = (entries: PlacementEntry[]) => {
      entries.forEach(entry => {
        placement.set(entry.card.id, entry);
      });
    };

    toOutside && copyEntries(toOutside.entries);
    fromOutside && copyEntries(fromOutside.entries);
    insideWithConns && copyEntries(insideWithConns.entries);
    insideNoConns && copyEntries(insideNoConns.entries);
    anotherNs && copyEntries(anotherNs.entries);

    return placement;
  }

  private alignColumns(
    cardsColumns: CardsColumns,
    kinds: PlacementKind[],
  ): Map<PlacementKind, EntriesGroup> {
    const alignment = new Map();

    const columnHeights: Map<PlacementEntry[], number> = new Map();
    const offset = { x: 0, y: 0 };
    let entireHeight = 0;

    kinds.forEach(kind => {
      const columns = cardsColumns.get(kind);
      if (columns == null) return;

      const entries: PlacementEntry[] = [];
      const bbox = XYWH.fromArgs(offset.x, offset.y, 0, 0);

      columns.forEach((column: PlacementMeta[], ci: number) => {
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

        bbox.w += columnWidth + (ci === 0 ? 0 : sizes.endpointHPadding);
        bbox.h = Math.max(bbox.h, offset.y - sizes.endpointVPadding);

        entireHeight = Math.max(entireHeight, bbox.h);
      });

      alignment.set(kind, { entries, bbox });
    });

    columnHeights.forEach((columnHeight: number, entries: PlacementEntry[]) => {
      if (entries.length === 0) return;

      const kind = entries[0].kind;
      const verticalOffset = (entireHeight - columnHeight) / 2;

      entries.forEach(entry => {
        entry.geometry.y += verticalOffset;
      });
    });

    return alignment;
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

  // { senderId -> SenderArrows }
  // SenderArrows: { senderId, startPoint, arrows: { receiverId -> Connector }}
  @computed
  get arrows(): Map<string, SenderArrows> {
    const arrows: Map<string, SenderArrows> = new Map();
    const curveGap = Vec2.from(sizes.connectorCardGap, 0);

    // Offsets is used for arrows going around card not to overlap with another
    // arrows that go around the same card. They vary depending on direction:
    // whether it goes from bottom to connector of from top to connector.
    const topOffsets: Map<string, number> = new Map();
    const bottomOffsets: Map<string, number> = new Map();

    this.connectors.forEach((senderIndex, senderId) => {
      const senderPlacement = this.cardsPlacement.get(senderId)?.geometry;
      if (senderPlacement == null) return;

      const arrowStart = Vec2.from(
        senderPlacement.x + senderPlacement.w,
        senderPlacement.y + sizes.arrowStartTopOffset,
      );

      const shiftedStart = arrowStart.add(curveGap);
      const arrow: SenderArrows = {
        senderId,
        startPoint: arrowStart,
        arrows: new Map(),
      };

      senderIndex.forEach((connector, receiverId) => {
        const receiverPlacement = this.cardsPlacement.get(receiverId)?.geometry;
        if (receiverPlacement == null) return;

        const shiftedConnector = connector.position.sub(curveGap);
        let firstPoints = [shiftedStart, shiftedConnector];

        const startIsTooBend = arrowStart.x > connector.position.x;
        if (startIsTooBend) {
          // prettier-ignore

          firstPoints = rounding.goAroundTheBox(
            senderPlacement,
            shiftedStart,
            shiftedConnector,
            sizes.aroundCardPadX,
            sizes.aroundCardPadY,
          ).map(Vec2.fromXY);
        }

        // prettier-ignore
        const offsets = arrowStart.y > connector.position.y ?
          bottomOffsets :
          topOffsets;

        const npoints = firstPoints.length;
        const senderPoint = firstPoints[npoints - 2]; // Always not undefined

        // prettier-ignore
        const lastPoints = rounding
          .goAroundTheBox(
            receiverPlacement,
            senderPoint,
            shiftedConnector,
            sizes.aroundCardPadX,
            sizes.aroundCardPadY,
          )
          .map(Vec2.fromXY);

        if (lastPoints.length > 2) {
          const offsetNum = offsets.get(receiverId) ?? 1;
          const offset = offsetNum * sizes.arrowOverlapGap;
          offsets.set(receiverId, offsetNum + 1);

          const atConnector = connector.position.clone();
          atConnector.x -= offset;

          // TODO: this is not fair offset, vector prolongation should be used
          const beforeConnector = lastPoints[lastPoints.length - 2];
          beforeConnector.x = connector.position.x - offset;

          lastPoints.splice(lastPoints.length - 1, 1, atConnector);
          firstPoints.splice(npoints - 1, 1, ...lastPoints.slice(1));
        }

        const points = firstPoints.concat([connector.position]);
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
  get connections() {
    return this.interactions.connections;
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
  get namespaceBBox(): XYWH {
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
        const apPos = this.accessPointsCoords.get(apId);
        if (apPos == null) return;

        midPoint = midPoint.add(apPos);
        npoints += 1;
      });

      if (npoints === 0) return;
      index.set(receiverId, midPoint.mul(1 / npoints));
    });

    return index;
  }

  // D E B U G
  @computed
  get debugData() {
    return {
      dimensions: this.cardDimensions,
      apCoords: this.accessPointsCoords,
      placement: this.placement,
    };
  }
}
