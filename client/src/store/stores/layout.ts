import { action, computed, observable, reaction } from 'mobx';
import _ from 'lodash';

import {
  dummy as geom,
  Vec2,
  XY,
  WH,
  XYWH,
  rounding,
  utils as gutils,
} from '~/domain/geometry';
import { ServiceCard } from '~/domain/service-card';
import {
  Placement,
  PlacementEntry,
  PlacementMeta,
  PlacementKind,
  EntriesGroup,
  SenderArrows,
  ServiceConnector,
} from '~/domain/layout';
import { ids } from '~/domain/ids';

import InteractionStore from './interaction';
import ServiceStore from './service';
import ControlStore from './controls';

import { Advancer } from '~/utils/advancer';
import { sizes } from '~/ui/vars';
// { senderId -> { receiverId -> ServiceConnector } }
export type Connectors = Map<string, Map<string, ServiceConnector>>;

export type CardsPlacement = Map<string, PlacementEntry>;
export type CardsColumns = Map<string, PlacementMeta[][]>;

type PlacementFilter = (e: PlacementEntry) => boolean;
interface CardOffsets {
  top: Advancer<string, number>;
  bottom: Advancer<string, number>;
  around: Advancer<string, number>;
}

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
      () => this.services.cardsList,
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
    this.services.cardsList.forEach(card => {
      if (this.cardDimensions.has(card.id)) return;

      this.cardDimensions.set(card.id, LayoutStore.defaultCardDims());
    });
  }

  @action.bound
  setAccessPointCoords(id: string, coords: Vec2) {
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

    this.services.cardsList.forEach((card: ServiceCard) => {
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
    let weight = -incomingsCount + outgoingsCount;

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
    const overlapGap = sizes.arrowOverlapGap;
    const offsets: CardOffsets = {
      top: Advancer.new<string, number>(overlapGap, overlapGap),
      bottom: Advancer.new<string, number>(overlapGap, overlapGap),
      around: Advancer.new<string, number>(overlapGap, sizes.aroundCardPadX),
    };

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
        const receiverPlacement = this.cardsPlacement.get(receiverId);
        if (receiverPlacement == null) return;

        const shiftedConnector = connector.position.sub(curveGap);
        const initialPoints = [shiftedStart, shiftedConnector] as [Vec2, Vec2];
        const points = this.makeArrowPath(
          arrowStart,
          connector.position,
          initialPoints,
          senderPlacement,
          receiverPlacement,
          offsets,
        );

        arrow.arrows.set(receiverId, { connector, points });
      });

      arrows.set(senderId, arrow);
    });

    return arrows;
  }

  private makeArrowPath(
    arrowStart: Vec2,
    connector: Vec2,
    initialPoints: [Vec2, Vec2],
    senderPlacement: XYWH,
    receiverPlacement: PlacementEntry,
    offsets: CardOffsets,
  ): Vec2[] {
    const [shiftedStart, shiftedConnector] = initialPoints;
    const destinationIsBehind = arrowStart.x > connector.x;
    const receiverId = receiverPlacement.card.id;
    const receiverBBox = receiverPlacement.geometry;
    let points = initialPoints.slice();

    // receiver card is in front of sender card, so no workaround required
    if (!destinationIsBehind) return points.concat([connector]);

    points = rounding
      .goAroundTheBox(
        senderPlacement,
        shiftedStart,
        shiftedConnector,
        sizes.aroundCardPadX,
        sizes.aroundCardPadY,
      )
      .map(Vec2.fromXY);

    const npoints = points.length;
    const senderPoint = points[npoints - 2]; // Always not undefined
    const aroundOffset = offsets.around.advance(receiverId);

    const lastPoints = rounding
      .goAroundTheBox(
        receiverBBox,
        senderPoint,
        shiftedConnector,
        sizes.aroundCardPadX + aroundOffset,
        sizes.aroundCardPadY + aroundOffset,
      )
      .map(Vec2.fromXY);

    if (lastPoints.length > 2 || senderPlacement == receiverBBox) {
      const [a, b] = lastPoints.slice(lastPoints.length - 2);
      const offsetAdvancer = a.y > b.y ? offsets.bottom : offsets.top;
      const offset = offsetAdvancer.advance(receiverId);
      const newShiftedConnector = connector.clone(-offset);

      // TODO: this is not fair offset, vector prolongation should be used
      const beforeConnector = lastPoints[lastPoints.length - 2];
      beforeConnector.x = newShiftedConnector.x;

      this.replaceEnding(lastPoints, [newShiftedConnector]);
    }

    if (lastPoints.length === 2) {
      offsets.around.rewind(receiverId);
    }

    // replace that segment where we apply goAround
    points.splice(npoints - 2, 2, ...lastPoints);
    points = this.removeSharpAngleAtConnector(points.concat([connector]));

    return points;
  }

  // Helper for replacing end of points chain
  // Replacement is an array points, where first point is the same as as last
  // point in src array
  private replaceEnding(src: any[], replacement: any[]) {
    src.splice(src.length - 1, 1, ...replacement);
  }

  private removeSharpAngleAtConnector(points: Vec2[]) {
    // Check angle between last two segments of arrow to avoid sharp angle
    // on connector
    const [a, b, c] = points.slice(points.length - 3);
    const angleThreshold = Math.PI / 9;
    const angle = gutils.angleBetweenSegments(a, b, c);

    if (angle > angleThreshold) return points;

    points.splice(points.length - 2, 1);
    return points;
  }

  @computed
  get connectors(): Connectors {
    // Connectors gives geometry information about where connector is located.
    // It also gives secondary information about which APs are accessed

    const index = new Map<string, Map<string, ServiceConnector>>();
    const connectorIndices: Map<string, number> = new Map();
    const connectorGap = sizes.distanceBetweenConnectors;
    const connectors = new Map<string, ServiceConnector>();

    this.connections.outgoings.forEach((senderIndex, senderId) => {
      if (!index.has(senderId)) {
        index.set(senderId, new Map());
      }

      const senderConnectors = index.get(senderId)!;

      senderIndex.forEach((accessPointsMap, receiverId) => {
        const senders = this.connections.incomings.get(receiverId);
        if (senders == null) return;

        const nSenders = senders.size;
        const gutHeight = (nSenders - 1) * connectorGap;
        const idx = connectorIndices.get(receiverId) || 0;

        const midPoint = this.connectorMidPoints.get(receiverId);
        if (midPoint == null) return;

        const cardBBox = this.cardsPlacement.get(receiverId)?.geometry;
        if (cardBBox == null) return;

        const connectorId = ids.cardConnector(
          receiverId,
          accessPointsMap.keys(),
        );

        const existedConnector = connectors.get(connectorId);
        if (existedConnector) {
          existedConnector.sendersIds.add(senderId);
          senderConnectors.set(receiverId, existedConnector);
          return;
        }

        const position = midPoint.clone();
        position.y = midPoint.y - gutHeight / 2 + idx * connectorGap;
        position.x = cardBBox.x - sizes.connectorCardGap;

        const newConnector: ServiceConnector = {
          id: connectorId,
          sendersIds: new Set([senderId]),
          receiverId,
          position,
          accessPointsMap,
        };

        connectors.set(connectorId, newConnector);
        senderConnectors.set(receiverId, newConnector);
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
    const index = new Map<string, Vec2>();

    this.connections.incomings.forEach((receiverIndex, receiverId) => {
      let midPoint = Vec2.from(0, 0);
      let npoints = 0;

      // TODO: would be cool to be able to fetch it from service card
      // WARN: it could be a strange architecture
      const receiverAccessPoints: Set<string> = new Set();

      receiverIndex.forEach(accessPoints => {
        accessPoints.forEach((accessPointMeta, accessPointId) => {
          receiverAccessPoints.add(accessPointId);
        });
      });

      receiverAccessPoints.forEach(accessPointId => {
        const position = this.accessPointsCoords.get(accessPointId);
        if (position == null) return;

        midPoint = midPoint.add(position);
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
