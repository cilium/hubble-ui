import React, {
  FunctionComponent,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { trace } from 'mobx';
import { observer } from 'mobx-react';

import * as d3 from 'd3';
import _ from 'lodash';

import { sizes, colors } from '~/ui/vars';

import { chunks } from '~/utils/iter-tools';
import { XYWH, Vec2, Line2, utils as gutils } from '~/domain/geometry';
import { ConnectorArrow, SenderArrows } from '~/domain/layout';

export interface Props {
  arrows: Map<string, SenderArrows>;
  apPositions: Map<string, Vec2>;
}

interface ArrowData {
  points: Array<Vec2>;
  handles: [Vec2, Vec2][];
}

type Arrow = [string, ArrowData];

const arrowLine = (points: Vec2[]): string => {
  if (points.length < 2) return '';

  if (points.length === 2) {
    const [a, b] = points;
    return `M ${a.x} ${a.y} L${b.x} ${b.y}`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const r = sizes.arrowRadius;

  let line = `M ${first.x} ${first.y}`;

  chunks(points, 3, 2).forEach((chunk: Vec2[], idx: number, ntotal: number) => {
    const [a, b, c] = chunk;
    let [d, e, angle] = gutils.roundCorner(r, [a, b, c]);

    // This case occurs much more rarely than others, so using roundCorner
    // one more time is ok since angle computaion is part of entire function
    if (angle < Math.PI / 4) {
      [d, e, angle] = gutils.roundCorner(r * Math.sin(angle), [a, b, c]);
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

const startPlatePath = (d: any) => {
  const { x, y } = d[1];

  // prettier-ignore
  const r = 3, w = 10, h = 30;
  const tr = `a ${r} ${r} 0 0 1 ${r} ${r}`;
  const br = `a ${r} ${r} 0 0 1 -${r} ${r}`;

  return `
    M ${x} ${y - h / 2}
    h ${w - r}
    ${tr}
    v ${h - 2 * r}
    ${br}
    h -${w - r}
    z
  `;
};

const generalExit = (exit: any) => {
  exit.remove();
};

const startPlatesEnter = (enter: any) => {
  return enter
    .append('g')
    .attr('class', (d: any) => d[0])
    .append('path')
    .attr('fill', colors.connectorFill)
    .attr('stroke', colors.arrowStroke)
    .attr('stroke-width', sizes.linkWidth)
    .attr('d', startPlatePath);
};

const startPlatesUpdate = (update: any) => {
  return update.select('g path').attr('d', startPlatePath);
};

const arrowHandle = (handle: [Vec2, Vec2] | null): string => {
  if (handle == null) return '';
  const hwFactor = sizes.arrowHandleHWRatio;

  const [start, end] = handle;
  const width = start.distance(end);
  const height = width * hwFactor;

  const line = Line2.throughPoints(start, end);
  const side = line.normal.mul(width / 2);

  const baseA = start.add(side);
  const baseB = start.sub(side);

  const lookingRight = end.x - start.x > 0;
  const sweep = lookingRight ? 0 : 1;

  const r = 2;
  const [ar1, ar2] = gutils.roundCorner(r, [start, baseA, end]);
  const [br1, br2] = gutils.roundCorner(r, [start, baseB, end]);
  const [er1, er2] = gutils.roundCorner(r, [baseA, end, baseB]);

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

const arrowHandleId = (handle: [Vec2, Vec2]): string => {
  const [from, to] = handle;
  const mid = gutils.linterp2(from, to, 0.5);

  // WARN: precision lose here
  return `${mid.x | 0},${mid.y | 0}`;
};

const arrowHandleEnter = (enter: any) => {
  return enter
    .append('path')
    .attr('class', 'handle')
    .attr('fill', colors.arrowHandle)
    .attr('stroke', 'none')
    .attr('d', (handle: [Vec2, Vec2]) => arrowHandle(handle));
};

const arrowHandleUpdate = (update: any) => {
  return update.attr('d', (handle: [Vec2, Vec2]) => arrowHandle(handle));
};

const arrowsEnter = (enter: any) => {
  const arrowGroup = enter.append('g').attr('class', (d: Arrow) => d[0]);

  arrowGroup
    .append('path')
    .attr('class', 'line')
    .attr('stroke', colors.arrowStroke)
    .attr('stroke-width', sizes.linkWidth)
    .attr('fill', 'none')
    .attr('d', (d: Arrow) => arrowLine(d[1].points));

  arrowGroup
    .selectAll('path.handle')
    .data((d: Arrow) => d[1].handles, arrowHandleId)
    .join(arrowHandleEnter, _.identity, generalExit);

  return arrowGroup;
};

const arrowsUpdate = (update: any) => {
  update.select('path.line').attr('d', (d: Arrow) => arrowLine(d[1].points));
  update
    .selectAll('path.handle')
    .data((d: Arrow) => d[1].handles, arrowHandleId)
    .join(arrowHandleEnter, arrowHandleUpdate, generalExit);

  return update;
};

const feetsEnter = (enter: any) => {
  const feetGroup = enter.append('g').attr('class', (d: any) => d[0]);

  feetGroup
    .append('line')
    .attr('class', 'outer')
    .attr('x1', (d: any) => d[1][0].x)
    .attr('y1', (d: any) => d[1][0].y)
    .attr('x2', (d: any) => d[1][1].x)
    .attr('y2', (d: any) => d[1][1].y)
    .attr('stroke', colors.feetOuterStroke)
    .attr('stroke-width', sizes.feetOuterWidth);

  feetGroup
    .append('line')
    .attr('class', 'inner')
    .attr('x1', (d: any) => d[1][0].x)
    .attr('y1', (d: any) => d[1][0].y)
    .attr('x2', (d: any) => d[1][1].x)
    .attr('y2', (d: any) => d[1][1].y)
    .attr('stroke', colors.feetInnerStroke)
    .attr('stroke-width', sizes.feetInnerWidth);

  return feetGroup;
};

const feetsUpdate = (update: any) => {
  update
    .select('line.outer')
    .attr('x1', (d: any) => d[1][0].x)
    .attr('y1', (d: any) => d[1][0].y)
    .attr('x2', (d: any) => d[1][1].x)
    .attr('y2', (d: any) => d[1][1].y);

  update
    .select('line.inner')
    .attr('x1', (d: any) => d[1][0].x)
    .attr('y1', (d: any) => d[1][0].y)
    .attr('x2', (d: any) => d[1][1].x)
    .attr('y2', (d: any) => d[1][1].y);

  return update;
};

const connectorsEnter = (enter: any) => {
  return enter
    .append('g')
    .attr('class', (d: any) => d[0])
    .append('circle')
    .attr('cx', (d: any) => d[1].x)
    .attr('cy', (d: any) => d[1].y)
    .attr('r', 7.5)
    .attr('stroke', colors.arrowStroke)
    .attr('stroke-width', sizes.linkWidth)
    .attr('fill', colors.connectorFill);
};

const connectorsUpdate = (update: any) => {
  return update
    .select('circle')
    .attr('cx', (d: any) => d[1].x)
    .attr('cy', (d: any) => d[1].y);
};

// Handle is created for each segment of arrow whose length >= minArrowLength
const arrowHandlesFromPoints = (points: Vec2[]): [Vec2, Vec2][] => {
  if (points.length < 2) return [];

  const handles: [Vec2, Vec2][] = [];
  chunks(points, 2, 1).forEach(([start, end]) => {
    if (start.distance(end) < sizes.minArrowLength) return;

    const mid = start.linterp(end, 0.5);
    const direction = end.sub(start).normalize();

    if (direction.isZero()) return;

    const handleLength = sizes.arrowHandleWidth;
    const handleFrom = mid.sub(direction.mul(handleLength / 2));
    const handleTo = mid.add(direction.mul(handleLength / 2));

    handles.push([handleFrom, handleTo]);
  });

  return handles;
};

const manageArrows = (props: Props, g: SVGGElement) => {
  const arrowsMap = props.arrows;
  const apPositions = props.apPositions;

  const rootGroup = d3.select(g);
  const startPlatesGroup = rootGroup.select('.start-plates');
  const arrowsGroup = rootGroup.select('.arrows');
  const connectorsGroup = rootGroup.select('.connectors');
  const feetsGroup = rootGroup.select('.feets');

  const startPlates: Array<[string, Vec2]> = [];
  const arrows: Array<Arrow> = [];
  const connectors: Array<[string, Vec2]> = [];
  const arrowHandles: Array<[string, [Vec2, Vec2]]> = [];
  const feets: Array<[string, [Vec2, Vec2]]> = [];

  // Just split data to simple arrays so that it will be easier to work
  // with them in d3
  arrowsMap.forEach((senderArrows, senderId) => {
    startPlates.push([senderId, senderArrows.startPoint]);

    senderArrows.arrows.forEach((connectorArrow, receiverId) => {
      const fromToId = `${senderId} -> ${receiverId}`;
      const allPoints = [senderArrows.startPoint].concat(connectorArrow.points);
      const arrowHandles = arrowHandlesFromPoints(allPoints);

      // prettier-ignore
      arrows.push([fromToId, {
          points: allPoints,
          handles: arrowHandles,
      }]);

      const connectorPosition = connectorArrow.connector.position;
      connectors.push([fromToId, connectorPosition]);

      connectorArrow.connector.apIds.forEach(apId => {
        const feetId = `${fromToId} -> ${apId}`;
        const apPosition = apPositions.get(apId);

        if (apPosition == null) return;

        feets.push([feetId, [connectorPosition, apPosition]]);
      });
    });
  });

  const fns = {
    startPlates: {
      enter: startPlatesEnter,
      update: startPlatesUpdate,
    },
    arrows: {
      enter: arrowsEnter,
      update: arrowsUpdate,
    },
    connectors: {
      enter: connectorsEnter,
      update: connectorsUpdate,
    },
    feets: {
      enter: feetsEnter,
      update: feetsUpdate,
    },
    common: {
      exit: generalExit,
    },
  };

  startPlatesGroup
    .selectAll('g')
    .data(startPlates, (d: any) => d[0])
    .join(fns.startPlates.enter, fns.startPlates.update, fns.common.exit);

  arrowsGroup
    .selectAll('g')
    .data(arrows, (d: any) => d[0])
    .join(fns.arrows.enter, fns.arrows.update, fns.common.exit);

  connectorsGroup
    .selectAll('g')
    .data(connectors, (d: any) => d[0])
    .join(fns.connectors.enter, fns.connectors.update, fns.common.exit);

  feetsGroup
    .selectAll('g')
    .data(feets, (d: any) => d[0])
    .join(fns.feets.enter, fns.feets.update, fns.common.exit);
};

// This component manages multiple arrows to be able to draw them
// properly using d3
export const Component: FunctionComponent<Props> = observer(
  function ArrowsRenderer(props: Props) {
    const rootRef = useRef<SVGGElement>(null as any);

    useEffect(() => {
      if (rootRef == null || rootRef.current == null) return;

      manageArrows(props, rootRef.current);
    }, [props.arrows, props.apPositions, rootRef]);

    return (
      <g ref={rootRef} className="arrows">
        <g className="arrows" />
        <g className="start-plates" />
        <g className="feets" />
        <g className="connectors" />
      </g>
    );
  },
);

export const ArrowsRenderer = React.memo(Component);
