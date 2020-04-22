import { XY, WH } from './general';

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

  public static empty(): XYWH {
    return new XYWH(0, 0, 0, 0);
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

    return XYWH.fromArgs(
      this.x + dx,
      this.y + dy,
      this.w * scale,
      this.h * scale,
    );
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
}
