import * as d3 from 'd3';
import _ from 'lodash';
import { observer } from 'mobx-react';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import { Line2, utils as gutils, Vec2 } from '~/domain/geometry';
import { SenderArrows } from '~/domain/layout';
import { Verdict } from '~/domain/hubble';
import { Link } from '~/domain/service-map';

import { colors, sizes } from '~/ui/vars';
import { chunks } from '~/utils/iter-tools';

export interface Props {
  arrows: Map<string, SenderArrows>;
  accessPointsCoords: Map<string, Vec2>;
}

interface ArrowData {
  points: Array<Vec2>;
  handles: [Vec2, Vec2][];
}

interface FeetData {
  connectorPosition: Vec2;
  accessPointCoord: Vec2;
  link: Link;
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

  chunks(points, 3, 2).forEach((chunk: Vec2[]) => {
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
  // XXX: why d3.select('g path').attr(...) is not working?
  return update.each((d: any, i: any, e: any) => {
    d3.select(e[i]).select('path').attr('d', startPlatePath);
  });
};

const arrowHandle = (handle: [Vec2, Vec2] | null): string => {
  if (handle == null) return '';

  const [start, end] = handle;
  const width = start.distance(end);

  const line = Line2.throughPoints(start, end);
  const side = line.normal.mul(width / 2);

  const baseA = start.add(side);
  const baseB = start.sub(side);

  const criteria = (baseA.x - baseB.x) * (end.y - start.y);
  const sweep = criteria < 0 ? 0 : 1;

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

const feetHelpers = {
  setPositions(group: any) {
    return group
      .attr('x1', (d: [string, FeetData]) => d[1].connectorPosition.x)
      .attr('y1', (d: [string, FeetData]) => d[1].connectorPosition.y)
      .attr('x2', (d: [string, FeetData]) => d[1].accessPointCoord.x)
      .attr('y2', (d: [string, FeetData]) => d[1].accessPointCoord.y);
  },
  innerFirstVerdictStroke(d: [string, FeetData]) {
    const { verdicts } = d[1].link;

    if (verdicts.has(Verdict.Forwarded) && verdicts.has(Verdict.Dropped)) {
      return undefined;
    } else if (verdicts.has(Verdict.Dropped)) {
      return colors.feetDroppedStroke;
    }

    return colors.feetForwardedStroke;
  },
  innerSecondVerdictStroke(d: [string, FeetData]) {
    const { verdicts } = d[1].link;

    if (verdicts.has(Verdict.Forwarded) && verdicts.has(Verdict.Dropped)) {
      return colors.feetDroppedStroke;
    }

    return undefined;
  },
  innerSecondVerdictStrokeDasharray(d: [string, FeetData]) {
    return d[1].link.verdicts.size > 1 ? '5 4' : undefined;
  },
};

const feetsEnter = (enter: any) => {
  const feetGroup = enter
    .append('g')
    .attr('class', (d: [string, FeetData]) => d[0]);

  feetHelpers.setPositions(
    feetGroup
      .append('line')
      .attr('class', 'outer')
      .attr('stroke-width', sizes.feetOuterWidth)
      .attr('stroke', colors.feetOuterStroke),
  );

  feetHelpers.setPositions(
    feetGroup
      .append('line')
      .attr('class', 'inner-first-verdict')
      .attr('stroke-width', sizes.feetInnerWidth)
      .attr('stroke', feetHelpers.innerFirstVerdictStroke),
  );

  feetHelpers.setPositions(
    feetGroup
      .append('line')
      .attr('class', 'inner-second-verdict')
      .attr('stroke-width', sizes.feetInnerWidth)
      .attr('stroke', feetHelpers.innerSecondVerdictStroke)
      .attr('stroke-dasharray', feetHelpers.innerSecondVerdictStrokeDasharray),
  );

  return feetGroup;
};

const feetsUpdate = (update: any) => {
  feetHelpers.setPositions(update.select('line.outer'));

  feetHelpers.setPositions(
    update
      .select('line.inner-first-verdict')
      .attr('stroke', feetHelpers.innerFirstVerdictStroke),
  );

  feetHelpers.setPositions(
    update
      .select('line.inner-second-verdict')
      .attr('stroke', feetHelpers.innerSecondVerdictStroke)
      .attr('stroke-dasharray', feetHelpers.innerSecondVerdictStrokeDasharray),
  );

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
  chunks(points, 2, 1).forEach(([start, end], i: number, n: number) => {
    if (i === n - 1) return;
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
  const accessPointsCoords = props.accessPointsCoords;

  const rootGroup = d3.select(g);
  const startPlatesGroup = rootGroup.select('.start-plates');
  const arrowsGroup = rootGroup.select('.arrows');
  const connectorsGroup = rootGroup.select('.connectors');
  const feetsGroup = rootGroup.select('.feets');

  const startPlates: Array<[string, Vec2]> = [];
  const arrows: Array<Arrow> = [];
  const connectors: Array<[string, Vec2]> = [];
  const knownConnectors: Set<string> = new Set();
  const feets: Array<[string, FeetData]> = [];

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

      const connector = connectorArrow.connector;
      if (!knownConnectors.has(connector.id)) {
        connectors.push([connector.id, connector.position]);
        knownConnectors.add(connector.id);
      }

      connector.accessPointsMap.forEach((link, accessPointId) => {
        const feetId = `${fromToId} -> ${accessPointId}`;
        const accessPointCoord = accessPointsCoords.get(accessPointId);

        if (accessPointCoord == null) return;

        const feetData: FeetData = {
          connectorPosition: connector.position,
          accessPointCoord,
          link,
        };

        feets.push([feetId, feetData]);
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
    }, [props.arrows, props.accessPointsCoords, rootRef]);

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
