import { XY, WH } from './general';
import { tooSmall } from '~/domain/misc';

export interface Sides {
  top: [XY, XY];
  bottom: [XY, XY];
  left: [XY, XY];
  right: [XY, XY];
}

export class XYWH implements XY, WH {
  public x: number;
  public y: number;
  public w: number;
  public h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  public static fromArgs(x: number, y: number, w: number, h: number): XYWH {
    return new XYWH(x, y, w, h);
  }

  public static fromParts(xy: XY, wh: WH): XYWH {
    return new XYWH(xy.x, xy.y, wh.w, wh.h);
  }

  public static fromDOMRect(dr: DOMRect): XYWH {
    return new XYWH(dr.x, dr.y, dr.width, dr.height);
  }

  public static empty(): XYWH {
    return new XYWH(0, 0, 0, 0);
  }

  public applyDOMMatrix(m: DOMMatrix): XYWH {
    const xy = new DOMPoint(this.x, this.y);
    const txy = xy.matrixTransform(m);

    // const wh = new DOMPoint(this.w, this.h);
    // const twh = wh.matrixTransform(m);
    const w = this.w * m.a;
    const h = this.h * m.d;

    return XYWH.fromArgs(txy.x, txy.y, w, h);
  }

  // The same logic as in CSS
  public addMargin(t: number, r?: number, b?: number, l?: number): XYWH {
    let effR, effB, effL;

    if (r == null) {
      effL = t;
      effR = t;
      effB = t;
    } else if (b == null) {
      effB = t;
      effL = r;
      effR = r;
    } else if (l == null) {
      effB = b;
      effL = r;
      effR = r;
    } else {
      effB = b;
      effL = l;
      effR = r;
    }

    const x = this.x - effL;
    const y = this.y - t;
    const w = this.w + effL + effR;
    const h = this.h + t + effB;

    return XYWH.fromArgs(x, y, w, h);
  }

  public transform(dx: number, dy: number, scale?: number): XYWH {
    scale = scale || 1.0;

    return XYWH.fromArgs(this.x + dx, this.y + dy, this.w * scale, this.h * scale);
  }

  public setWH(wh: WH): XYWH {
    return XYWH.fromArgs(this.x, this.y, wh.w, wh.h);
  }

  public setHeight(h: number): XYWH {
    return XYWH.fromArgs(this.x, this.y, this.w, h);
  }

  public setXY(x?: number, y?: number): XYWH {
    return XYWH.fromArgs(x ?? this.x, y ?? this.y, this.w, this.h);
  }

  public addXY(dx: number, dy: number, inPlace = true): XYWH {
    if (inPlace) {
      this.x += dx;
      this.y += dy;

      return this;
    }

    return XYWH.fromArgs(this.x + dx, this.y + dy, this.w, this.h);
  }

  public centerRelativeTo(xy: XY): XY {
    return {
      x: this.center.x - xy.x,
      y: this.center.y - xy.y,
    };
  }

  public equals(rhs?: XYWH | null): boolean {
    if (rhs == null) return false;

    return (
      tooSmall(this.x - rhs.x) &&
      tooSmall(this.y - rhs.y) &&
      tooSmall(this.w - rhs.w) &&
      tooSmall(this.h - rhs.h)
    );
  }

  public get sides(): Sides {
    const leftX = this.x;
    const rightX = this.x + this.w;

    const topY = this.y;
    const bottomY = this.y + this.h;

    // prettier-ignore
    return {
      top: [
        { x: leftX, y: topY },
        { x: rightX, y: topY },
      ],
      bottom: [
        { x: leftX, y: bottomY },
        { x: rightX, y: bottomY },
      ],
      left: [
        { x: leftX, y: topY },
        { x: leftX, y: bottomY },
      ],
      right: [
        { x: rightX, y: topY },
        { x: rightX, y: bottomY },
      ],
    };
  }

  public get isFinite(): boolean {
    return (
      Number.isFinite(this.x) &&
      Number.isFinite(this.y) &&
      Number.isFinite(this.w) &&
      Number.isFinite(this.h)
    );
  }

  public get isEmpty(): boolean {
    return tooSmall(this.x) && tooSmall(this.y) && tooSmall(this.w) && tooSmall(this.h);
  }

  public get xy(): XY {
    return { x: this.x, y: this.y };
  }

  public get wh(): WH {
    return { w: this.w, h: this.h };
  }

  public get center(): XY {
    return { x: this.x + this.w / 2, y: this.y + this.h / 2 };
  }
}
