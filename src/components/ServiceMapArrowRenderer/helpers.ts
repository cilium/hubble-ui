import { XY, Vec2, Line2, utils as geomUtils } from '~/domain/geometry';
import { AccessPointArrow, ServiceMapArrow } from '~/ui-layer/service-map/coordinates/arrow';

import { chunks } from '~/utils/iter-tools';
import { colors, sizes } from '~/ui/vars';
import { LinkThroughput, Verdict } from '~/domain/hubble';

// NOTE: ArrowHandle is a small triangle rendered on the middle of the arrow
export type ArrowHandle = [Vec2, Vec2];

export type InnerArrowsLines = d3.Selection<SVGLineElement, AccessPointArrow, SVGGElement, unknown>;

export type FlowsIndicatorCircle = d3.Selection<
  SVGCircleElement,
  LinkThroughput,
  SVGGElement,
  unknown
>;

// NOTE: Handle is created for each segment of arrow path if length of
// NOTE: the segment >= sizes.arrowHandleWidth (i e if it is long enough)
export const collectHandles = (arrow: ServiceMapArrow): ArrowHandle[] => {
  const points = arrow.points;
  if (points.length < 2) return [];

  const handles: ArrowHandle[] = [];
  chunks(points, 2, 1).forEach(([start, end], i: number, n: number) => {
    if (i === n - 1) return;
    if (geomUtils.distance(start, end) < sizes.minArrowLength) return;

    const startVec = Vec2.fromXY(start);
    const endVec = Vec2.fromXY(end);

    const mid = startVec.linterp(endVec, 0.5);
    const direction = endVec.sub(startVec).normalize();

    if (direction.isZero()) return;

    const handleLength = sizes.arrowHandleWidth;
    const handleFrom = mid.sub(direction.mul(handleLength / 2));
    const handleTo = mid.add(direction.mul(handleLength / 2));

    handles.push([handleFrom, handleTo]);
  });

  return handles;
};

export const arrowHandleId = (handle: ArrowHandle, arrow: ServiceMapArrow): string => {
  const [from, to] = handle;
  const mid = geomUtils.linterp2(from, to, 0.5);

  // WARN: precision lose here
  return `${arrow.id}-${Math.trunc(mid.x)},${Math.trunc(mid.y)}`;
};

const setInnerArrowEndsCoords = (lines: InnerArrowsLines): InnerArrowsLines => {
  return lines
    .attr('x1', d => d.start?.x || 0)
    .attr('y1', d => d.start?.y || 0)
    .attr('x2', d => d.end?.x || 0)
    .attr('y2', d => d.end?.y || 0);
};

const innerArrowColor = (arrow: AccessPointArrow): string => {
  return arrow.hasAbnormalVerdict ? colors.feetRedStroke : colors.feetNeutralStroke;
};

const innerArrowStrokeStyle = (arrow: AccessPointArrow): string | null => {
  const v = arrow.verdicts;
  return v.size > 1 && v.has(Verdict.Dropped) ? '7 15' : null;
};

const innerArrowStrokeWidth = (arrow: AccessPointArrow): number => {
  return arrow.verdicts.has(Verdict.Dropped) ? sizes.feetInnerWidthThick : sizes.feetInnerWidth;
};

export const innerArrows = {
  setBeginningAndEndCoords: setInnerArrowEndsCoords,
  strokeColor: innerArrowColor,
  strokeStyle: innerArrowStrokeStyle,
  strokeWidth: innerArrowStrokeWidth,
};

const setFlowsInfoIndicatorPosition = (
  self: FlowsIndicatorCircle,
  coords: XY | null,
): FlowsIndicatorCircle => {
  if (coords == null) return self;

  return self.attr('cx', coords.x).attr('cy', coords.y);
};

export const flowsInfoIndicator = {
  setPosition: setFlowsInfoIndicatorPosition,
};

const arrowHandlePath = (handle: ArrowHandle | null): string => {
  if (handle == null) return '';

  const [start, end] = handle;
  const width = start.distance(end);

  const line = Line2.throughPoints(start, end);
  const side = line.normal.mul(width / 2);

  const baseA = start.add(side);
  const baseB = start.sub(side);

  const sweep = geomUtils.pointSideOfLine(start, end, baseA) > 0 ? 0 : 1;

  const r = 2;
  const [ar1, ar2] = geomUtils.roundCorner(r, [start, baseA, end]);
  const [br1, br2] = geomUtils.roundCorner(r, [start, baseB, end]);
  const [er1, er2] = geomUtils.roundCorner(r, [baseA, end, baseB]);

  return `
    M ${start.x} ${start.y}
    L ${ar1.x} ${ar1.y}
    A ${r} ${r} 0 0 ${sweep} ${ar2.x} ${ar2.y}
    L ${er1.x} ${er1.y}
    A ${r} ${r} 0 0 ${sweep} ${er2.x} ${er2.y}
    L ${br2.x} ${br2.y}
    A ${r} ${r} 0 0 ${sweep} ${br1.x} ${br1.y}
    Z
  `;
};

const arrowLinePath = (points: XY[]): string => {
  if (points.length < 2) return '';

  if (points.length === 2) {
    const [a, b] = points;
    return `M ${a.x} ${a.y} L${b.x} ${b.y}`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const r = sizes.arrowRadius;

  let line = `M ${first.x} ${first.y}`;

  chunks(points, 3, 2).forEach((chunk: XY[]) => {
    const [a, b, c] = chunk;
    let [d, e, angle] = geomUtils.roundCorner(r, [a, b, c]);

    // This case occurs much more rarely than others, so using roundCorner
    // one more time is ok since angle computaion is part of entire function
    if (angle < Math.PI / 4) {
      [d, e, angle] = geomUtils.roundCorner(r * Math.sin(angle), [a, b, c]);
    }

    const ab = Vec2.from(b.x - a.x, b.y - a.y);
    const bc = Vec2.from(c.x - b.x, c.y - b.y);
    const sweep = ab.isClockwise(bc) ? 0 : 1;

    line += `
      L ${d.x} ${d.y}
      A ${r} ${r} 0 0 ${sweep} ${e.x} ${e.y}
    `;
  });

  line += `L ${last.x} ${last.y}`;
  return line;
};

const startPlatePath = (lineEnding: XY) => {
  const { x, y } = lineEnding;

  // prettier-ignore
  const r = 3, w = 5, h = 20;
  const tr = `a ${r} ${r} 0 0 1 ${r} ${r}`;
  const br = `a ${r} ${r} 0 0 1 -${r} ${r}`;

  return `
    M ${x - 1} ${y - h / 2}
    h ${w - r}
    ${tr}
    v ${h - 2 * r}
    ${br}
    h -${w - r}
    z
  `;
};

export const svg = {
  arrowHandlePath,
  arrowLinePath,
  startPlatePath,
};
