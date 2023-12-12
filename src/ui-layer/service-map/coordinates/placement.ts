import { action, computed, observable, reaction, makeObservable, runInAction } from 'mobx';
import _ from 'lodash';

import { Method as HttpMethod } from '~/domain/http';
import { XYWH, XY, dummy as geom } from '~/domain/geometry';
import { ServiceCard } from '~/domain/service-map';

import { ControlStore } from '~/store/stores/controls';
import { InteractionStore } from '~/store/stores/interaction';
import { ServiceStore } from '~/store/stores/service';
import { NamespaceStore } from '~/store/stores/namespace';

import { StoreFrame } from '~/store/frame';
import { PlacementStrategy } from '~/ui/layout/abstract';

import { sizes } from '~/ui/vars';

export enum PlacementKind {
  FromWorld = 'FromWorld',
  ToWorld = 'ToWorld',
  AnotherNamespace = 'AnotherNamespace',
  InsideWithConnections = 'InsideWithConnections',
  InsideWithoutConnections = 'InsideWithoutConnections',
  OutsideManaged = 'OutsideManaged',
}

export interface PlacementMeta {
  kind: PlacementKind;
  card: ServiceCard;
  weight: number;
}

export interface PlacementEntry {
  kind: PlacementKind;
  card: ServiceCard;
  geometry: XYWH;
}

export interface EntriesGroup {
  entries: PlacementEntry[];
  bbox: XYWH;
}

type PlacementFilter = (e: PlacementEntry) => boolean;

export type Placement = Array<PlacementEntry>;
export type CardsPlacement = Map<string, PlacementEntry>;
export type CardsColumns = Map<string, PlacementMeta[][]>;

// TODO: move it away from domain
export class ServiceMapPlacementStrategy extends PlacementStrategy {
  @observable
  private controls: ControlStore;

  @observable
  private interactions: InteractionStore;

  @observable
  private services: ServiceStore;

  @observable
  private namespaces: NamespaceStore;

  // NOTE: { receiverId -> { urlPath -> { HttpMethod -> XY }}}
  @observable
  protected _httpEndpointCoords: Map<string, Map<string, Map<HttpMethod, XY>>>;

  constructor(frame: StoreFrame) {
    super();
    makeObservable(this);
    this.controls = frame.controls;
    this.interactions = frame.interactions;
    this.services = frame.services;
    this.namespaces = frame.namespaces;
    this._httpEndpointCoords = new Map();

    reaction(
      () => this.cardsPlacement,
      () => this.rebuild(),
    );
  }

  public reset() {
    runInAction(() => {
      super.reset();
      this._httpEndpointCoords.clear();
    });
  }

  @action.bound
  public setHttpEndpointCoords(svcId: string, urlPath: string, method: HttpMethod, coords: XY) {
    if (!this._httpEndpointCoords.has(svcId)) {
      this._httpEndpointCoords.set(svcId, new Map());
    }

    const svcUrlPaths = this._httpEndpointCoords.get(svcId)!;
    if (!svcUrlPaths.has(urlPath)) {
      svcUrlPaths.set(urlPath, new Map());
    }

    svcUrlPaths.get(urlPath)?.set(method, coords);
  }

  @action.bound
  public setHttpEndpointsCoords(
    coords: {
      cardId: string;
      urlPath: string;
      method: HttpMethod;
      bbox: XYWH;
    }[],
  ) {
    coords.forEach(c => {
      this.setHttpEndpointCoords(c.cardId, c.urlPath, c.method, c.bbox.center);
    });
  }

  @computed
  public get httpEndpointCoords() {
    return new Map(this._httpEndpointCoords);
  }

  @computed
  public get bbox(): XYWH {
    let width = this.namespaceBBox ? this.namespaceBBox.w : 0;
    let height = this.namespaceBBox ? this.namespaceBBox.h : 0;
    let x = this.namespaceBBox ? this.namespaceBBox.x : 0;
    let y = this.namespaceBBox ? this.namespaceBBox.y : 0;

    this.cardsXYs.forEach((xy: XY, cardId: string) => {
      const wh = this.cardsWHs.get(cardId);
      if (wh == null) return;

      width = Math.max(width, xy.x + wh.w);
      height = Math.max(height, xy.y + wh.h);

      x = Math.min(x, xy.x);
      y = Math.min(y, xy.y);
    });

    return new XYWH(x, y, width, height);
  }

  @computed
  public get namespaceBBox(): XYWH | null {
    return this.cardsBBox(e => {
      const one = e.kind === PlacementKind.InsideWithConnections;
      const two = e.kind === PlacementKind.InsideWithoutConnections;

      return one || two;
    });
  }

  @action.bound
  public rebuild() {
    this.cardsPlacement.forEach((plcEntry: PlacementEntry, cardId: string) => {
      this.cardsXYs.set(cardId, plcEntry.geometry);
    });
  }

  private cardsBBox(filterFn: PlacementFilter): XYWH | null {
    const bbox = geom.xywh(Infinity, Infinity);

    this.cardsPlacement.forEach((e: PlacementEntry) => {
      if (!filterFn(e)) return;

      const { x, y, w, h } = e.geometry;

      bbox.x = Math.min(bbox.x, x);
      bbox.y = Math.min(bbox.y, y);

      // Temporarily store here maxX, maxY for a while
      bbox.w = Math.max(bbox.w, x + w);
      bbox.h = Math.max(bbox.h, y + h);
    });

    if (!bbox.isFinite) return null;

    bbox.w -= bbox.x;
    bbox.h -= bbox.y;

    return bbox;
  }

  @computed
  private get cardsPlacement(): CardsPlacement {
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
    const currentNs = this.namespaces.current;

    this.services.cardsList.forEach((card: ServiceCard) => {
      const meta = this.getCardPlacementMeta(card, currentNs?.namespace || undefined);
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
        y: toOutside.bbox.h + 2 * sizes.namespaceBackplatePadding,
      };

      // prettier-ignore
      fromOutside && shiftEntries(middleShift, fromOutside.entries);
      insideWithConns && shiftEntries(middleShift, insideWithConns.entries);
      insideNoConns && shiftEntries(middleShift, insideNoConns.entries);
    }

    const buildShiftForBottom = (): XY => {
      const shift = { x: 0, y: 0 };

      if (toOutside != null) {
        shift.y += toOutside.bbox.h + 2 * sizes.namespaceBackplatePadding;
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
        shift.y += middleHeight + 2 * sizes.namespaceBackplatePadding;
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
          let cardWH = this.cardsDimensions.get(meta.card.id);
          if (cardWH == null) {
            cardWH = this.defaultCardXYWH().wh;
          }

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

      const verticalOffset = (entireHeight - columnHeight) / 2;

      entries.forEach(entry => {
        entry.geometry.y += verticalOffset;
      });
    });

    return alignment;
  }

  @computed
  get connections() {
    return this.interactions.connections;
  }
}
