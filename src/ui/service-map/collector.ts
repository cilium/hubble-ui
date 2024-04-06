import _ from 'lodash';
import { MutableRefObject as MutRef } from 'react';

import { StoreFrame } from '~/store/frame';
import { reactionRef } from '~/ui/react/refs';
import { getIntersectBBoxAsync } from '~/ui/hooks/useIntersectCoords';
import { EventEmitter } from '~/utils/emitter';

import { XYWH } from '~/domain/geometry';
import { Method } from '~/domain/http';
import { L7Kind } from '~/domain/hubble';

export enum Event {
  CoordsUpdated = 'coords-updated',
}

export type IdentifierBBox = {
  id: string;
  bbox: XYWH;
};

export type APIdentifierBBox = {
  id: string;
  cardId: string;
  bbox: XYWH;
};

export type HTTPIdentifiedBBox = {
  cardId: string;
  urlPath: string;
  method: Method;
  bbox: XYWH;
};

export type AllCoords = {
  accessPoints: APIdentifierBBox[];
  cards: IdentifierBBox[];
  httpEndpoints: HTTPIdentifiedBBox[];
};

export type Handlers = {
  [Event.CoordsUpdated]: (coords: AllCoords) => void;
};

// NOTE: This is a helper class that collects refs to important elements
// that are used as connectors
export class RefsCollector extends EventEmitter<Handlers> {
  private accessPoints: Map<string, MutRef<HTMLDivElement | null>> = new Map();
  private cardRoots: Map<string, MutRef<HTMLDivElement | null>> = new Map();

  // NOTE: { urlPathname -> { httpMethod -> ref }}
  private httpConnectors: Map<string, Map<string, MutRef<HTMLDivElement | null>>> = new Map();

  private throttledCardsUpdated?: _.DebouncedFunc<() => void> | null = null;
  private rootSVGGElement: SVGGElement | null = null;

  constructor(private frame: StoreFrame) {
    super(false);

    this.throttledCardsUpdated = _.debounce(async () => {
      await this.cardsUpdated();
    }, 0);
  }

  public clear() {
    this.throttledCardsUpdated?.cancel();

    this.accessPoints.clear();
    this.cardRoots.clear();
    this.httpConnectors.clear();
    this.rootSVGGElement = null;
  }

  public onCoordsUpdated(fn: Handlers[Event.CoordsUpdated]): this {
    this.on(Event.CoordsUpdated, fn);
    return this;
  }

  public cardRoot(cardId: string): MutRef<HTMLDivElement | null> {
    const existing = this.cardRoots.get(cardId);
    if (existing != null) return existing;

    const newRef = reactionRef(null, _elem => {
      this.throttledCardsUpdated?.();
    });

    this.cardRoots.set(cardId, newRef);
    return newRef;
  }

  public accessPointConnector(apId: string): MutRef<HTMLDivElement | null> {
    const existing = this.accessPoints.get(apId);
    if (existing != null) return existing;

    const newRef = reactionRef(null, _elem => {
      this.throttledCardsUpdated?.();
    });

    this.accessPoints.set(apId, newRef);
    return newRef;
  }

  public httpMethodConnector(
    urlPathname: string,
    httpMethod: Method,
  ): MutRef<HTMLDivElement | null> {
    if (!this.httpConnectors.has(urlPathname)) {
      this.httpConnectors.set(urlPathname, new Map());
    }

    const pathnames = this.httpConnectors.get(urlPathname);
    const existing = pathnames?.get(httpMethod);
    if (existing != null) return existing;

    const newRef = reactionRef(null, _elem => {
      this.throttledCardsUpdated?.();
    });

    pathnames?.set(httpMethod, newRef);
    return newRef;
  }

  public cardsMutationsObserved() {
    this.throttledCardsUpdated?.();
  }

  public async cardsUpdated() {
    const apCoordsPromises: Promise<APIdentifierBBox>[] = [];
    const cardCoordsPromises: Promise<IdentifierBBox>[] = [];
    const httpCoordsPromises: Promise<HTTPIdentifiedBBox>[] = [];

    this.cardRoots.forEach((cardRef, cardId) => {
      const cardRoot = cardRef.current;
      // NOTE: An element has null body when detached from current DOM Tree
      if (cardRoot == null || cardRoot.closest('body') == null) {
        console.log(`card ${cardId} is invisible now`);
        return;
      }

      // NOTE: We need that root element to be able to take DOMMatrix
      this.ensureRootSVGGElement(cardRoot);

      // NOTE: Save card's bbox
      const p = getIntersectBBoxAsync({
        elem: cardRoot,
        oneshot: true,
      }).then(bbox => ({ bbox, id: cardId }));

      cardCoordsPromises.push(p);

      const svc = this.frame.services.cardsMap.get(cardId);
      if (svc == null) {
        console.warn(`cannot find svc for card ${cardId}`);
        return;
      }

      // NOTE: Traverse across all the cards endpoints and save their coords
      const l7endpoints = this.frame.interactions.l7endpoints.get(cardId);
      svc.accessPoints.forEach((ap, id) => {
        const apRef = this.accessPoints.get(id);
        if (apRef == null || apRef.current == null) {
          console.warn(`cannot find ap ${id} ref for svc ${cardId}`);
          return;
        }

        const p = getIntersectBBoxAsync({
          elem: apRef.current,
          oneshot: true,
        }).then(bbox => ({ bbox, id, cardId }));

        apCoordsPromises.push(p);

        // NOTE: Now we are going to check if there are some http endpoints
        // for this access point
        const httpEndpoints = l7endpoints?.get(`${ap.port}`)?.get(L7Kind.HTTP);
        if (httpEndpoints == null) return;

        httpEndpoints.forEach(httpEndpoint => {
          const http = httpEndpoint.ref.http;
          if (http == null) return;

          const urlPath = http.parsedUrl?.pathname;
          const httpRef = this.httpConnectors.get(urlPath)?.get(http.method);
          if (httpRef == null || httpRef.current == null) return;

          const p = getIntersectBBoxAsync({
            elem: httpRef.current,
            oneshot: true,
          }).then(bbox => ({ bbox, cardId, urlPath, method: http.method }));

          httpCoordsPromises.push(p);
        });
      });
    });

    // NOTE: Wait for all the coords before actually applying DOMMatrix to them
    const [apCoords, cardCoords, httpCoords] = await Promise.all([
      Promise.all(apCoordsPromises),
      Promise.all(cardCoordsPromises),
      Promise.all(httpCoordsPromises),
    ]);

    const g = this.rootSVGGElement;
    if (g == null) {
      console.warn('root svg g element is null: it could happen because of frame flush');
      return;
    }

    // NOTE: Keep this call away from any previous layout transformations as it
    // can cause layout thrashing
    const m = g.getScreenCTM()?.inverse();
    if (m == null) {
      console.warn('cannot get inversed screen matrix, wat?');
      return;
    }

    this.emit(Event.CoordsUpdated, {
      accessPoints: this.mapAPCoordsWithMatrix(apCoords, m),
      cards: this.mapCoordsWithMatrix(cardCoords, m),
      httpEndpoints: this.mapHTTPCoordsWithMatrix(httpCoords, m),
    });
  }

  private mapCoordsWithMatrix(coords: IdentifierBBox[], m: DOMMatrix): IdentifierBBox[] {
    return coords.map(c => ({
      id: c.id,
      bbox: c.bbox.applyDOMMatrix(m),
    }));
  }

  private mapHTTPCoordsWithMatrix(
    coords: HTTPIdentifiedBBox[],
    m: DOMMatrix,
  ): HTTPIdentifiedBBox[] {
    return coords.map(c => ({
      ...c,
      bbox: c.bbox.applyDOMMatrix(m),
    }));
  }

  private mapAPCoordsWithMatrix(coords: APIdentifierBBox[], m: DOMMatrix): APIdentifierBBox[] {
    return coords.map(c => ({
      ...c,
      bbox: c.bbox.applyDOMMatrix(m),
    }));
  }

  private ensureRootSVGGElement(elem: HTMLElement): SVGGElement | null {
    if (this.rootSVGGElement != null) return this.rootSVGGElement;

    const g = elem.closest('svg')?.querySelector('g');
    if (g == null) return null;

    this.rootSVGGElement = g;
    return this.rootSVGGElement;
  }
}
