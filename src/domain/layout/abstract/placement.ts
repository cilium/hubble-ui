import { action, computed, observable } from 'mobx';

import { XYWH, WH, XY } from '~/domain/geometry';

export abstract class PlacementStrategy {
  @observable
  protected cardsWHs: Map<string, WH>;

  @observable
  protected cardsXYs: Map<string, XY>;

  @observable
  protected _accessPointCoords: Map<string, XY>;

  constructor() {
    this.cardsWHs = new Map();
    this.cardsXYs = new Map();

    this._accessPointCoords = new Map();
  }

  public abstract get bbox(): XYWH;

  @action.bound
  public reset() {
    this.cardsWHs.clear();
    this.cardsXYs.clear();
    this._accessPointCoords.clear();
  }

  @action.bound
  public getCardCoords(cardId: string): XY | null {
    return this.cardsXYs.get(cardId) || null;
  }

  @action.bound
  public getCardDimensions(cardId: string): WH | null {
    return this.cardsWHs.get(cardId) || null;
  }

  @action.bound
  public getCardXYWH(cardId: string): XYWH | null {
    const xy = this.getCardCoords(cardId);
    if (xy == null) return null;

    const wh = this.getCardDimensions(cardId);
    if (wh == null) return null;

    return XYWH.fromParts(xy, wh);
  }

  @action.bound
  public getCardXYWHOrDefault(cardId: string): XYWH {
    const real = this.getCardXYWH(cardId);
    if (real != null) return real;

    return this.defaultCardXYWH();
  }

  @action.bound
  public setCardWH(cardId: string, wh: WH) {
    this.cardsWHs.set(cardId, {
      w: wh.w,
      h: wh.h,
    });
  }

  @action.bound
  public defaultCardXYWH(): XYWH {
    return new XYWH(0, 0, this.defaultCardW, this.defaultCardH);
  }

  @action.bound
  public setCardWidth(cardId: string, width: number) {
    const cardWH = this.cardsWHs.get(cardId);

    this.cardsWHs.set(cardId, {
      w: width,
      h: cardWH ? cardWH.h : this.defaultCardH,
    });
  }

  @action.bound
  public setCardHeight(cardId: string, height: number) {
    const cardWH = this.cardsWHs.get(cardId);

    this.cardsWHs.set(cardId, {
      w: cardWH ? cardWH.w : this.defaultCardW,
      h: height,
    });
  }

  @action.bound
  public setAccessPointCoords(apId: string, coords: XY) {
    this._accessPointCoords.set(apId, coords);
  }

  @computed
  get accessPointCoords(): Map<string, XY> {
    return new Map(this._accessPointCoords);
  }

  @computed
  get cardsDimensions(): Map<string, WH> {
    return new Map(this.cardsWHs);
  }

  @computed
  get cardsCoords(): Map<string, XY> {
    return new Map(this.cardsXYs);
  }

  @computed
  get cardsBBoxes(): Map<string, XYWH> {
    const bboxes = new Map();

    this.cardsWHs.forEach((dims: WH, cardId: string) => {
      const coords = this.cardsXYs.get(cardId);
      if (coords == null) return;

      bboxes.set(cardId, XYWH.fromParts(coords, dims));
    });

    return bboxes;
  }

  @computed
  public get defaultCardW(): number {
    return 560;
  }

  @computed
  public get defaultCardH(): number {
    return 0;
  }

  @computed
  public get numCards(): number {
    return Math.min(this.cardsXYs.size, this.cardsWHs.size);
  }
}
