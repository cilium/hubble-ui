import { XY } from './general';
import { XYWH, Sides } from './xywh';
import { Vec2 } from './vec2';

// TODO: optimize it
export const angleBetweenSegments = (p0: XY, p1: XY, p2: XY): number => {
  const side1X = p0.x - p1.x;
  const side1Y = p0.y - p1.y;
  const side2X = p2.x - p1.x;
  const side2Y = p2.y - p1.y;

  const l1 = distance(p0, p1);
  const l2 = distance(p1, p2);

  if (l1 < Number.EPSILON || l2 < Number.EPSILON) return 0;

  const dotProduct = side1X * side2X + side1Y * side2Y;
  const cos = dotProduct / (l1 * l2);

  return Math.acos(cos);
};

export const distance = (from: XY, to: XY): number => {
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);

  return Math.sqrt(dx ** 2 + dy ** 2);
};

export const linterp2 = (from: XY, to: XY, t: number): XY => {
  return {
    x: from.x * (1 - t) + to.x * t,
    y: from.y * (1 - t) + to.y * t,
  };
};

// Calculate points where arc should start from and to where should it go
// to form a rounded corner, assuming that points follows as:
//          points[1]
//              *
//             | \
//      side1 |   \ side2
//           |     \
// points[0] *      * points[2]

export const roundCorner = (r: number, points: [XY, XY, XY]): [XY, XY, number] => {
  const p0 = points[0];
  const p1 = points[1];
  const p2 = points[2];
  const angle = angleBetweenSegments(p0, p1, p2);

  // NOTE: This is a corner case and in fact this `if` will not prevent external
  // code from possible error. This case is when some of `points` are the same.
  if (angle < Number.EPSILON) {
    return [points[0], points[2], Math.PI];
  }

  const offset = r / Math.tan(angle / 2);
  const roundStart = linterp2(p1, p0, offset / distance(p0, p1));
  const roundEnd = linterp2(p1, p2, offset / distance(p2, p1));

  return [roundStart, roundEnd, angle];
};

// NOTE: this function returns 0 if point is on line [start, end]
// 1 if point is on right side relative to direction from start to end
// -1 otherwise
export const pointSideOfLine = (start: XY, end: XY, point: XY): -1 | 0 | 1 => {
  const a = (end.x - start.x) * (point.y - start.y);
  const b = (end.y - start.y) * (point.x - start.x);
  const result = a - b;

  // NOTE: this strange check is for case when -0 === 0
  return Math.sign(result === 0 ? 0 : result) as -1 | 0 | 1;
};
