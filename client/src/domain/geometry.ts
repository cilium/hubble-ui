export interface XY {
  x: number;
  y: number;
}

export interface WH {
  w: number;
  h: number;
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
}

export const dummy = {
  xy(x = 0, y = 0): XY {
    return { x, y };
  },
  xywh(x = 0, y = 0, w = 0, h = 0): XYWH {
    return XYWH.fromArgs(x, y, w, h);
  },
};
