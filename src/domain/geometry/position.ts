// Positions can be compared using JS comparison operators
// Position is bigger than another one if vertical coordinate is bigger
//
// bitmask has format: `tmbrcl`
// tmb means `Top Middle Bottom` (vertical position)
// rcl means `Right Center Left` (horizontal position)
//
// +Position.Any needs only for jest, as it doesnt recognize toPrimitive coerce
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import * as csstype from 'csstype';

const p = (n: number) => Position.new(n);

export class Position {
  public static readonly Top = p(0b100000);
  public static readonly Middle = p(0b010000);
  public static readonly Bottom = p(0b001000);
  public static readonly Left = p(0b000001);
  public static readonly Center = p(0b000010);
  public static readonly Right = p(0b000100);

  public static readonly TopLeft = p(+Position.Top | +Position.Left);
  public static readonly TopRight = p(+Position.Top | +Position.Right);
  public static readonly TopCenter = p(+Position.Top | +Position.Center);
  public static readonly MiddleLeft = p(+Position.Middle | +Position.Left);
  public static readonly MiddleRight = p(+Position.Middle | +Position.Right);
  public static readonly MiddleCenter = p(+Position.Middle | +Position.Center);
  public static readonly BottomLeft = p(+Position.Bottom | +Position.Left);
  public static readonly BottomRight = p(+Position.Bottom | +Position.Right);
  public static readonly BottomCenter = p(+Position.Bottom | +Position.Center);

  public static new(n: number) {
    return new Position(n);
  }

  constructor(public n: number) {}

  [Symbol.toPrimitive](hint = 'number') {
    if (hint !== 'string') return this.n;

    return this.toString();
  }

  public valueOf() {
    return this[Symbol.toPrimitive]();
  }

  public toString() {
    let s = '';

    if (this.top) {
      s = 'Top' + s;
    }

    if (this.middle) {
      s = 'Middle' + s;
    }

    if (this.bottom) {
      s = 'Bottom' + s;
    }

    if (this.left) {
      s += 'Left';
    }

    if (this.center) {
      s += 'Center';
    }

    if (this.right) {
      s += 'Right';
    }

    return s;
  }

  public get x(): number {
    return this.n & 0b111;
  }

  public get top(): boolean {
    return (this.n & +Position.Top) > 0;
  }

  public get middle(): boolean {
    return (this.n & +Position.Middle) > 0;
  }

  public get bottom(): boolean {
    return (this.n & +Position.Bottom) > 0;
  }

  public get left(): boolean {
    return (this.n & +Position.Left) > 0;
  }

  public get center(): boolean {
    return (this.n & +Position.Center) > 0;
  }

  public get right(): boolean {
    return (this.n & +Position.Right) > 0;
  }

  public get topLeft(): boolean {
    return (this.n & +Position.TopLeft) > 0;
  }

  public get topCenter(): boolean {
    return (this.n & +Position.TopCenter) > 0;
  }

  public get topRight(): boolean {
    return (this.n & +Position.TopRight) > 0;
  }

  public get bottomLeft(): boolean {
    return (this.n & +Position.BottomLeft) > 0;
  }

  public get bottomCenter(): boolean {
    return (this.n & +Position.BottomCenter) > 0;
  }

  public get bottomRight(): boolean {
    return (this.n & +Position.BottomRight) > 0;
  }

  public get middleCenter(): boolean {
    return this.center;
  }
}

export default Position;
