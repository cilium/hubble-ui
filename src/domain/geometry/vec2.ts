import { tooSmall } from '~/domain/misc';
import { XY } from './general';

export class Vec2 implements XY {
  public x: number;
  public y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public static from(x: number, y: number): Vec2 {
    return new Vec2(x, y);
  }

  public static fromXY(xy: XY): Vec2 {
    return new Vec2(xy.x, xy.y);
  }

  public static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  public static advance(p1: Vec2, p2: Vec2, d: number): [Vec2, Vec2] {
    const dist = p1.distance(p2);

    return [p1.linterp(p2, d / dist), p2.linterp(p1, -d / dist)];
  }

  public xy(): XY {
    return { x: this.x, y: this.y };
  }

  public sub(arg: XY): Vec2 {
    return new Vec2(this.x - arg.x, this.y - arg.y);
  }

  public add(arg: XY): Vec2 {
    return new Vec2(this.x + arg.x, this.y + arg.y);
  }

  public addInPlace(arg: XY): this {
    this.x += arg.x;
    this.y += arg.y;

    return this;
  }

  public mul(n: number): Vec2 {
    return new Vec2(this.x * n, this.y * n);
  }

  public linterp(rhs: Vec2, t: number): Vec2 {
    const x = this.x * (1 - t) + rhs.x * t;
    const y = this.y * (1 - t) + rhs.y * t;

    return new Vec2(x, y);
  }

  public slope(to: XY): number {
    const dx = to.x - this.x;
    if (tooSmall(dx)) return 0;

    return (to.y - this.y) / dx;
  }

  public normalize(): Vec2 {
    const l = this.length();
    if (l < Number.EPSILON) return Vec2.zero();

    return new Vec2(this.x / l, this.y / l);
  }

  public length(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  public distance(to: Vec2): number {
    const dx = Math.abs(to.x - this.x);
    const dy = Math.abs(to.y - this.y);

    return Math.sqrt(dx ** 2 + dy ** 2);
  }

  public angle(rhs: Vec2): number {
    const [l1, l2] = [this.length(), rhs.length()];
    if (l1 < Number.EPSILON || l2 < Number.EPSILON) return 0;

    const cos = this.dot(rhs) / (l1 * l2);
    return Math.acos(cos);
  }

  public directionAngle(): number {
    return this.angle(Vec2.from(1, 0));
  }

  public dot(rhs: Vec2): number {
    return this.x * rhs.x + this.y * rhs.y;
  }

  public negate(): Vec2 {
    return new Vec2(-this.x, -this.y);
  }

  public clone(dx = 0, dy = 0): Vec2 {
    return new Vec2(this.x + dx, this.y + dy);
  }

  public isZero(): boolean {
    return this.length() < Number.EPSILON;
  }

  public isClockwise(rhs: Vec2): boolean {
    return this.x * rhs.y - this.y * rhs.x < 0;
  }
}
