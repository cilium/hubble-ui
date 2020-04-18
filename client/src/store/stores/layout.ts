import { observable } from 'mobx';

import ServiceStore from './service';

import { ServiceCard } from '~/domain/service-card';
import { WH, XYWH, dummy as geom } from '~/domain/geometry';
import { PlacementEntry, Placement } from '~/domain/layout';
import { sizes } from '~/ui/vars';

const hPadding = sizes.endpointHPadding;

export default class LayoutStore {
  @observable
  private whs: Map<string, WH>;

  @observable
  private services: ServiceStore;

  constructor(services: ServiceStore) {
    this.services = services;

    this.whs = new Map();
  }

  public setCardWH(id: string, props: WH) {
    this.whs.set(`service-${id}`, props);
  }

  public setCardHeight(id: string, height: number) {
    const current = this.whs.get(id) || this.defaultCardWH();
    const newProps = { ...current, h: height };

    this.setCardWH(id, newProps);
  }

  public get placement(): Placement {
    // TODO: this should be cached somehow without losing reactivity
    return this.services.data.map((srvc: ServiceCard, i: number) => {
      const epGeom = this.cardWH(srvc.id) || this.defaultCardWH();

      const geometry = XYWH.fromArgs(
        i * (epGeom.w + hPadding),
        0,
        epGeom.w,
        epGeom.h,
      );

      return { geometry, serviceCard: srvc };
    }, {} as Placement);
  }

  public defaultCardWH(): WH {
    return { w: sizes.endpointWidth, h: 0 };
  }

  get cardWH() {
    return (id: string): WH | undefined => {
      return this.whs.get(`service-${id}`);
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
