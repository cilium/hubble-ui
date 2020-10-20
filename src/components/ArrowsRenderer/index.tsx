import * as d3 from 'd3';
import _ from 'lodash';
import { observer } from 'mobx-react';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import { Line2, utils as gutils, Vec2 } from '~/domain/geometry';
import {
  Arrow,
  ArrowColor,
  ArrowEnding,
  ArrowPath,
  ArrowPathsMap,
  EndingFigure,
  InnerEnding,
} from '~/domain/layout/abstract/arrows';

import { colors, sizes } from '~/ui/vars';
import { chunks } from '~/utils/iter-tools';

export interface Props {
  arrows: ArrowPathsMap;
}

interface FigureData {
  id: string;
  isStart: boolean;
  figure: EndingFigure;
  color: ArrowColor;
  coords: Vec2;
  direction: Vec2;
}

interface ArrowData {
  color: ArrowColor;
  points: Array<Vec2>;
  handles: [Vec2, Vec2][];
}

type RenderingArrow = [string, ArrowData];

interface FeetData {
  id: string;

  // NOTE: treat this field as outer connector coords
  endingCoords: Vec2;

  // NOTE: coords of inner "access point"
  innerCoords: Vec2;
  colors: Set<ArrowColor>;
}

// NOTE: returns stroke and fill colors
const figureColorProps = (fd: FigureData): [string, string] => {
  if (fd.figure === EndingFigure.Circle) {
    switch (fd.color) {
      case ArrowColor.Neutral:
        return [colors.connectorStroke, colors.connectorFill];
      case ArrowColor.Red:
        return [colors.connectorStrokeRed, colors.connectorFillRed];
      case ArrowColor.Green:
        return [colors.connectorStrokeGreen, colors.connectorFillGreen];
    }
  } else if (fd.figure === EndingFigure.Plate) {
    switch (fd.color) {
      case ArrowColor.Neutral:
        return [colors.startPlateStroke, colors.startPlateFill];
      case ArrowColor.Red:
        return [colors.connectorStrokeRed, colors.connectorFillRed];
      case ArrowColor.Green:
        return [colors.connectorStrokeGreen, colors.connectorFillGreen];
    }
  } else if (fd.figure === EndingFigure.Arrow) {
    switch (fd.color) {
      case ArrowColor.Neutral:
        return [colors.connectorStroke, colors.connectorStroke];
      case ArrowColor.Red:
        return [colors.connectorStrokeRed, colors.connectorStrokeRed];
      case ArrowColor.Green:
        return [colors.connectorStrokeGreen, colors.connectorStrokeGreen];
    }
  }

  return [colors.arrowStroke, colors.arrowStroke];
};

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
  const { x, y } = d.coords;

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

const generalExit = (exit: any) => {
  exit.remove();
};

const figureFillColor = (fd: FigureData): string => {
  const [_, fill] = figureColorProps(fd);
  return fill;
};

const figureStrokeColor = (fd: FigureData): string => {
  const [stroke, _] = figureColorProps(fd);
  return stroke;
};

const startPlatesEnter = (enter: any) => {
  return enter
    .append('path')
    .attr('fill', figureFillColor)
    .attr('stroke', figureStrokeColor)
    .attr('stroke-width', sizes.linkWidth)
    .attr('d', startPlatePath);
};

const startPlatesUpdate = (update: any) => {
  // XXX: why d3.select('g path').attr(...) is not working?
  return update.each((d: any, i: any, e: any) => {
    d3.select(e[i])
      .select('path')
      .attr('d', startPlatePath)
      .attr('stroke', figureStrokeColor as any);
  });
};

const arrowTriangle = (handle: [Vec2, Vec2] | null): string => {
  if (handle == null) return '';

  const [start, end] = handle;
  const width = start.distance(end);

  const line = Line2.throughPoints(start, end);
  const side = line.normal.mul(width / 2);

  const baseA = start.add(side);
  const baseB = start.sub(side);

  const criteria = (baseA.x - baseB.x) * (end.y - start.y);
  const sweep = criteria <= 0 ? 0 : 1;

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
  return `${Math.trunc(mid.x)},${Math.trunc(mid.y)}`;
};

const arrowHandleEnter = (enter: any) => {
  return enter
    .append('path')
    .attr('class', 'handle')
    .attr('fill', colors.arrowHandle)
    .attr('stroke', 'none')
    .attr('d', (handle: [Vec2, Vec2]) => arrowTriangle(handle));
};

const arrowHandleUpdate = (update: any) => {
  return update.attr('d', (handle: [Vec2, Vec2]) => arrowTriangle(handle));
};

const arrowStrokeColor = (ad: RenderingArrow) => {
  switch (ad[1].color) {
    case ArrowColor.Neutral:
      return colors.arrowStroke;
    case ArrowColor.Red:
      return colors.arrowStrokeRed;
    case ArrowColor.Green:
      return colors.arrowStrokeGreen;
  }

  return ArrowColor.Neutral;
};

const arrowsEnter = (enter: any) => {
  const arrowGroup = enter
    .append('g')
    .attr('class', (d: RenderingArrow) => d[0]);

  arrowGroup
    .append('path')
    .attr('class', 'line')
    .attr('stroke', arrowStrokeColor)
    .attr('stroke-width', sizes.linkWidth)
    .attr('fill', 'none')
    .attr('d', (d: RenderingArrow) => arrowLine(d[1].points));

  arrowGroup
    .selectAll('path.handle')
    .data((d: RenderingArrow) => d[1].handles, arrowHandleId)
    .join(arrowHandleEnter, _.identity, generalExit);

  return arrowGroup;
};

const arrowsUpdate = (update: any) => {
  update
    .select('path.line')
    .attr('d', (d: RenderingArrow) => arrowLine(d[1].points))
    .attr('stroke', arrowStrokeColor);

  update
    .selectAll('path.handle')
    .data((d: RenderingArrow) => d[1].handles, arrowHandleId)
    .join(arrowHandleEnter, arrowHandleUpdate, generalExit);

  return update;
};

const feetHelpers = {
  setPositions(group: any) {
    return group
      .attr('x1', (d: FeetData) => d.endingCoords.x)
      .attr('y1', (d: FeetData) => d.endingCoords.y)
      .attr('x2', (d: FeetData) => d.innerCoords.x)
      .attr('y2', (d: FeetData) => d.innerCoords.y);
  },
  innerStrokeColor(d: FeetData) {
    const feetColors = d.colors;

    if (feetColors.has(ArrowColor.Red)) {
      return colors.feetRedStroke;
    }

    return colors.feetNeutralStroke;
  },
  innerStrokeStyle(d: FeetData) {
    const feetColors = d.colors;

    return feetColors.size > 1 ? '5 4' : undefined;
  },
};

const feetsEnter = (enter: any) => {
  const feetGroup = enter.append('g').attr('class', (d: FeetData) => d.id);

  feetGroup
    .append('line')
    .attr('class', 'outer')
    .attr('stroke-width', sizes.feetOuterWidth)
    .attr('stroke', colors.feetOuterStroke)
    .call(feetHelpers.setPositions);

  feetGroup
    .append('line')
    .attr('class', 'inner')
    .attr('stroke', feetHelpers.innerStrokeColor)
    .attr('stroke-width', sizes.feetInnerWidth)
    .attr('stroke-dasharray', feetHelpers.innerStrokeStyle)
    .call(feetHelpers.setPositions);

  return feetGroup;
};

const feetsUpdate = (update: any) => {
  update.select('line.outer').call(feetHelpers.setPositions);

  update
    .select('line.inner')
    .attr('stroke', feetHelpers.innerStrokeColor)
    .attr('stroke-dasharray', feetHelpers.innerStrokeStyle)
    .call(feetHelpers.setPositions);

  return update;
};

const trianglePropsSet = (group: any) => {
  const triangleW = sizes.arrowHandleWidth;

  return group
    .attr('fill', figureFillColor)
    .attr('stroke', figureStrokeColor)
    .attr('d', (fd: FigureData) => {
      const triangleStart = fd.coords.sub(fd.direction.mul(triangleW));
      const triangleEnd = fd.coords;

      return arrowTriangle([triangleStart, triangleEnd]);
    });
};

const triangleEndingEnter = (enter: any) => {
  return enter.append('path').call(trianglePropsSet);
};

const triangleEndingUpdate = (update: any) => {
  return update.select('path').call(trianglePropsSet);
};

const connectorPropsSet = (group: any) => {
  return group
    .attr('cx', (d: any) => d.coords.x)
    .attr('cy', (d: any) => d.coords.y)
    .attr('r', 7.5)
    .attr('stroke', figureStrokeColor)
    .attr('stroke-width', sizes.connectorWidth)
    .attr('fill', figureFillColor);
};

const connectorsEnter = (enter: any) => {
  return enter.append('circle').call(connectorPropsSet);
};

const connectorsUpdate = (update: any) => {
  return update.select('circle').call(connectorPropsSet);
};

const figuresEnter = (enter: any) => {
  return enter
    .append('g')
    .attr('class', (d: FigureData) => d.id)
    .each((d: FigureData, i: number, group: any) => {
      const figureGroup = d3.select(group[i]);

      if (d.figure === EndingFigure.Plate) {
        figureGroup.call(startPlatesEnter);
      } else if (d.figure === EndingFigure.Circle) {
        figureGroup.call(connectorsEnter);
      } else if (d.figure === EndingFigure.Arrow) {
        figureGroup.call(triangleEndingEnter);
      } else {
        throw new Error(
          `enter: rendering of ${d.figure} ending figure is not implemented`,
        );
      }
    });
};

const figuresUpdate = (update: any) => {
  return update.each((d: FigureData, i: number, group: any) => {
    const figureGroup = d3.select(group[i]);

    if (d.figure === EndingFigure.Plate) {
      figureGroup.call(startPlatesUpdate);
    } else if (d.figure === EndingFigure.Circle) {
      figureGroup.call(connectorsUpdate);
    } else if (d.figure === EndingFigure.Arrow) {
      figureGroup.call(triangleEndingUpdate);
    } else {
      throw new Error(
        `update: rendering of ${d.figure} ending figure is not implemented`,
      );
    }
  });
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

// NOTE: returns directions of first two points and last two points
const calcDirections = (points: Vec2[]): [Vec2, Vec2] => {
  if (points.length < 2) return [Vec2.zero(), Vec2.zero()];

  const [first, second] = points.slice(0, 2);
  // NOTE: reversed, cz direction computed TO start point
  const startDir = first.sub(second).normalize();

  if (points.length === 2) return [startDir, startDir.clone()];

  const [prev, last] = points.slice(-2, points.length);
  const endDir = last.sub(prev).normalize();

  return [startDir, endDir];
};

const manageArrows = (arrows: ArrowPathsMap, g: SVGGElement) => {
  // console.log(`ArrowsRenderer::manageArrows`);
  const rootGroup = d3.select(g);
  const startFiguresGroup = rootGroup.select('.start-figures');
  const endFiguresGroup = rootGroup.select('.end-figures');
  const arrowsGroup = rootGroup.select('.arrows');
  const feetsGroup = rootGroup.select('.feets');

  const startFiguresMap: Map<string, FigureData> = new Map();
  const endFiguresMap: Map<string, FigureData> = new Map();

  const arrowsToRender: Array<RenderingArrow> = [];
  const feetsMap: Map<string, FeetData> = new Map();

  arrows.forEach((arrow, arrowId) => {
    const startId = arrow.start.endingId;
    const endId = `${startId} -> ${arrow.end.endingId}`;
    const allPoints = [arrow.start.coords].concat(arrow.points);
    const [startDirection, endDirection] = calcDirections(allPoints);

    if (!startFiguresMap.has(startId)) {
      // TODO: what if there are two arrows with different colors ?
      startFiguresMap.set(startId, {
        id: startId,
        isStart: true,
        figure: arrow.start.figure,
        color: arrow.color,
        coords: arrow.start.coords,
        direction: startDirection,
      });
    }

    if (!endFiguresMap.has(endId)) {
      endFiguresMap.set(endId, {
        id: arrow.end.endingId,
        isStart: false,
        figure: arrow.end.figure,
        color: arrow.color,
        coords: arrow.end.coords,
        direction: endDirection,
      });
    }

    const arrowHandles = !!arrow.noHandles
      ? []
      : arrowHandlesFromPoints(allPoints);

    arrowsToRender.push([
      arrow.arrowId,
      {
        points: allPoints,
        handles: arrowHandles,
        color: arrow.color,
      },
    ]);

    if (arrow.end.innerEndings != null) {
      arrow.end.innerEndings.forEach((ending, innerId) => {
        const feetId = innerId;
        if (feetsMap.has(feetId)) return;

        feetsMap.set(feetId, {
          id: feetId,
          endingCoords: arrow.end.coords,
          innerCoords: ending.coords,
          colors: ending.colors,
        });
      });
    }

    if (arrow.start.innerEndings != null) {
      arrow.start.innerEndings.forEach((ending, innerId) => {
        const feetId = innerId;

        feetsMap.set(feetId, {
          id: feetId,
          endingCoords: arrow.start.coords,
          innerCoords: ending.coords,
          colors: ending.colors,
        });
      });
    }
  });

  const fns = {
    arrows: {
      enter: arrowsEnter,
      update: arrowsUpdate,
    },
    feets: {
      enter: feetsEnter,
      update: feetsUpdate,
    },
    endingFigures: {
      enter: figuresEnter,
      update: figuresUpdate,
    },
    common: {
      exit: generalExit,
    },
  };

  arrowsGroup
    .selectAll('g')
    .data(arrowsToRender, (d: any) => d[0])
    .join(fns.arrows.enter, fns.arrows.update, fns.common.exit);

  feetsGroup
    .selectAll('g')
    .data([...feetsMap.values()], (d: any) => d.id)
    .join(fns.feets.enter, fns.feets.update, fns.common.exit);

  startFiguresGroup
    .selectAll('g')
    .data([...startFiguresMap.values()], (d: any) => d.id)
    .join(fns.endingFigures.enter, fns.endingFigures.update, fns.common.exit);

  endFiguresGroup
    .selectAll('g')
    .data([...endFiguresMap.values()], (d: any) => d.id)
    .join(fns.endingFigures.enter, fns.endingFigures.update, fns.common.exit);
};

// This component manages multiple arrows to be able to draw them
// properly using d3
export const Component: FunctionComponent<Props> = observer(
  function ArrowsRenderer(props: Props) {
    const rootRef = useRef<SVGGElement>(null as any);

    useEffect(() => {
      if (rootRef == null || rootRef.current == null) return;

      manageArrows(props.arrows, rootRef.current);
    }, [props.arrows, rootRef]);

    return (
      <g ref={rootRef} className="arrows">
        <g className="arrows" />
        <g className="feets" />
        <g className="start-figures" />
        <g className="end-figures" />
      </g>
    );
  },
);

export const ArrowsRenderer = React.memo(Component);
