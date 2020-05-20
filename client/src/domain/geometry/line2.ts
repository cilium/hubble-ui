import { XY } from './general';
import { Vec2 } from './vec2';

export class Line2 {
  public a = 0;
  public b = 0;
  public c = 0;

  constructor(a: number, b: number, c: number) {
    this.a = a;
    this.b = b;
    this.c = c;
  }

  public static throughPoints(p1: XY, p2: XY): Line2 {
    const k = (p2.y - p1.y) / (p2.x - p1.x);

    const a = -k;
    const b = 1;
    const c = k * p1.x - p1.y;

    return new Line2(a, b, c);
  }

  public static fromPoint(start: XY, direction: Vec2): Line2 {
    const k = direction.y / direction.x;

    const a = -k;
    const b = 1;
    const c = k * start.x - start.y;

    return new Line2(a, b, c);
  }

  public get normal(): Vec2 {
    return new Vec2(this.a, this.b).normalize();
  }

  public get direction(): Vec2 {
    const p1 = new Vec2(0, -this.c / this.b);
    const p2 = new Vec2(-this.c / this.a, 0);

    return p1.sub(p2).normalize();
  }
}
