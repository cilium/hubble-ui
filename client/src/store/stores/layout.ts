import { observable } from 'mobx';

import EndpointsStore from './endpoints';

import { Endpoint } from '~/domain/endpoint';
import { WH, XYWH, dummy as geom } from '~/domain/geometry';
import { sizes } from '~/ui/vars';

const hPadding = sizes.endpointHPadding;

export type Placement = Array<PlacementEntry>;
export interface PlacementEntry {
  endpoint: Endpoint;
  geometry: XYWH;
}

export default class LayoutStore {
  @observable
  private whs: Map<string, WH>;

  @observable
  private endpoints: EndpointsStore;

  constructor(endpoints: EndpointsStore) {
    this.endpoints = endpoints;

    this.whs = new Map();
  }

  public setEndpointWH(id: string, props: WH) {
    this.whs.set(`endpoint-${id}`, props);
  }

  public setEndpointHeight(id: string, height: number) {
    const current = this.whs.get(id) || this.defaultEndpointWH();
    const newProps = { ...current, h: height };

    this.setEndpointWH(id, newProps);
  }

  public get placement(): Placement {
    // TODO: this should be cached somehow without losing reactivity
    return this.endpoints.data.map((endpoint: Endpoint, i: number) => {
      const epGeom = this.endpointWH(endpoint.id) || this.defaultEndpointWH();

      const geometry = XYWH.fromArgs(
        i * (epGeom.w + hPadding),
        0,
        epGeom.w,
        epGeom.h,
      );

      return { geometry, endpoint };
    }, {} as Placement);
  }

  public defaultEndpointWH(): WH {
    return { w: sizes.endpointWidth, h: 0 };
  }

  get endpointWH() {
    return (id: string): WH | undefined => {
      return this.whs.get(`endpoint-${id}`);
    };
  }

  get endpointHeight() {
    return (id: string): number => {
      const g = this.endpointWH(id);

      return g ? g.h : 0;
    };
  }

  get endpointWidth() {
    return (id: string): number => {
      return sizes.endpointWidth;
    };
  }

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
}
