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

export class Position {
  public static readonly Top = Position.new(0b100000);
  public static readonly Middle = Position.new(0b010000);
  public static readonly Bottom = Position.new(0b001000);
  public static readonly Left = Position.new(0b000001);
  public static readonly Center = Position.new(0b000010);
  public static readonly Right = Position.new(0b000100);

  public static readonly TopLeft = Position.new(+Position.Top | +Position.Left);
  // prettier-ignore
  public static readonly TopRight = Position.new(+Position.Top | +Position.Right);
  // prettier-ignore
  public static readonly TopCenter = Position.new(+Position.Top | +Position.Center);
  // prettier-ignore
  public static readonly MiddleLeft = Position.new(+Position.Middle | +Position.Left);
  // prettier-ignore
  public static readonly MiddleRight = Position.new(+Position.Middle | +Position.Right);
  // prettier-ignore
  public static readonly MiddleCenter = Position.new(+Position.Middle | +Position.Center);
  // prettier-ignore
  public static readonly BottomLeft = Position.new(+Position.Bottom | +Position.Left);
  // prettier-ignore
  public static readonly BottomRight = Position.new(+Position.Bottom | +Position.Right);
  // prettier-ignore
  public static readonly BottomCenter = Position.new(+Position.Bottom | +Position.Center);

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
