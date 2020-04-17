export function lineIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
) {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1),
  };
}

export function distBetweenPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

export function putPointOnLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dist: number,
) {
  const rad = Math.atan2(y2 - y1, x2 - x1);
  const angle = rad * (180 / Math.PI);
  const sin = Math.sin(rad) * dist;
  const cos = Math.cos(rad) * dist;
  const x = x1 + cos;
  const y = y1 + sin;
  return { x, y, angle };
}
