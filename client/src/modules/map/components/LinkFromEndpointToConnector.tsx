import * as React from 'react';
import { MapEndpoint } from '../entities';
import { lineIntersect, putPointOnLine } from '../geometry';
import { sizes } from '../sizes';
import { isEgressEndpoint } from '../utils';
import { LinkArrow } from './LinkArrow';
import css from './LinkFromEndpointToConnector.scss';

export interface Props {
  readonly srcEndpoint: MapEndpoint;
  readonly dstEndpoint: MapEndpoint;
  readonly srcEndpointX: number;
  readonly srcEndpointY: number;
  readonly dstEndpointX: number;
  readonly dstEndpointY: number;
  readonly connectorX: number;
  readonly connectorY: number;
}

export const LinkFromEndpointToConnector = React.memo<Props>(props => {
  const {
    srcEndpoint,
    srcEndpointX,
    srcEndpointY,
    dstEndpointX,
    dstEndpointY,
    connectorX,
    connectorY,
  } = props;
  const isLoop = srcEndpointX === dstEndpointX && srcEndpointY === dstEndpointY;
  const isDSTEndpointLeftFromSRCEndpoint = dstEndpointX < srcEndpointX;
  const isDSTEndpointRightOrInOneColumnWithSRCEndpoint =
    dstEndpointX >= srcEndpointX;
  const isDSTEndpointLeftOrInOneColumnWithSRCEndpoint =
    dstEndpointX <= srcEndpointX;
  const isToEndpointIsAboveEndpoint = isEgressEndpoint(srcEndpoint);

  const srcY = isToEndpointIsAboveEndpoint
    ? srcEndpointY - 1
    : srcEndpointY + sizes['--endpoint-header-height'] / 2 + 12;
  const srcX = isToEndpointIsAboveEndpoint
    ? srcEndpointX + sizes['--endpoint-width'] / 2
    : srcEndpointX + sizes['--endpoint-width'] - 2;

  if (isLoop) {
    const fx = srcX;
    const fy = srcY;
    const fnx = srcEndpointX;
    const fny = srcEndpointY;
    const path = [
      `M${fx},${fy} ${fx + 6},${fy}`,
      `C${fx + 24},${fy} ${fx + 24},${fy} ${fx + 24},${fy - 24}`,
      `C${fx + 24} ${fny - 24},${fx + 24},${fny - 24} ${fx + 10},${fny - 24}`,
      `L${fnx - 10},${fny - 24}`,
      `C${fnx - 24},${fny - 24} ${fnx - 24},${fny - 24} ${connectorX},${fy -
        30}`,
      `L${connectorX},${connectorY}`,
    ].join(' ');

    const arrows = [];

    let ax = fx + 24;
    let ay = fny - 24 - (fny - 24 - fy) / 2;
    arrows.push(
      <LinkArrow
        key={`${fx + 24}:${fy}:${ax}:${ay}`}
        srcX={fx + 24}
        srcY={fy}
        dstX={ax}
        dstY={ay}
      />,
    );

    ax = connectorX - (connectorX - fx) / 2 - 24;
    ay = fny - 24;
    arrows.push(
      <LinkArrow
        key={`${fx + 24}:${fny - 24}:${ax}:${ay}`}
        srcX={fx + 24}
        srcY={fny - 24}
        dstX={ax}
        dstY={ay}
      />,
    );

    arrows.push(
      <LinkArrow
        key={`${connectorX}:${fny - 24}:${connectorX}:${connectorY - 20}`}
        srcX={connectorX}
        srcY={fny - 24}
        dstX={connectorX}
        dstY={connectorY - 20}
      />,
    );

    return (
      <g>
        <path
          d={path}
          strokeWidth={sizes['--link-width']}
          className={css.link}
          fill="none"
        />
        {arrows}
      </g>
    );
  } else if (
    isToEndpointIsAboveEndpoint ||
    isDSTEndpointLeftOrInOneColumnWithSRCEndpoint
  ) {
    const path = `M${srcX},${srcY} ${connectorX},${connectorY}`;
    const arrows = [];
    const arrowLineIntersect = lineIntersect.bind(
      null,
      srcX,
      srcY,
      connectorX,
      connectorY,
    );
    const interY = 9999999999;

    if (isToEndpointIsAboveEndpoint) {
      const diff = connectorX - srcX;
      arrows.push(
        arrowLineIntersect(
          srcX + diff / 1.25,
          -interY,
          srcX + diff / 1.25,
          interY,
        ),
      );
      arrows.push(
        arrowLineIntersect(srcX + diff / 2, -interY, srcX + diff / 2, interY),
      );
      arrows.push(
        arrowLineIntersect(srcX + diff / 4, -interY, srcX + diff / 4, interY),
      );
    } else if (isDSTEndpointLeftOrInOneColumnWithSRCEndpoint) {
      arrows.push(arrowLineIntersect(srcX, -interY, srcX - 40, interY));
      arrows.push(arrowLineIntersect(srcX, -interY, connectorX + 60, interY));
      arrows.push(arrowLineIntersect(srcX, -interY, connectorX - 60, interY));
      arrows.push(
        arrowLineIntersect(connectorX, -interY, connectorX + 25, interY),
      );
    }

    return (
      <g>
        <path
          d={path}
          strokeWidth={sizes['--link-width']}
          className={css.link}
          fill="none"
        />
        {arrows.map(({ x: arrowToX, y: arrowToY }) => (
          <LinkArrow
            key={`${srcX}:${srcY}:${arrowToX}:${arrowToY}`}
            srcX={srcX}
            srcY={srcY}
            dstX={arrowToX}
            dstY={arrowToY}
          />
        ))}
      </g>
    );
  } else {
    const startCurveOffset = isDSTEndpointRightOrInOneColumnWithSRCEndpoint
      ? sizes['--link-curve-radius']
      : -sizes['--link-curve-radius'];
    const endCurveOffset = -sizes['--link-curve-radius'];

    const startCurveEndPoint = putPointOnLine(
      srcX + startCurveOffset * 2,
      srcY,
      connectorX + endCurveOffset,
      connectorY,
      sizes['--link-curve-radius'],
    );
    const startCurveStartCoord = `${srcX + startCurveOffset},${srcY}`;
    const startCurveOuterCoord = `${srcX + startCurveOffset * 2},${srcY}`;
    const startCurveEndCoord = `${startCurveEndPoint.x},${startCurveEndPoint.y}`;
    const pathStart = `M${srcX},${srcY} ${startCurveStartCoord} C${startCurveOuterCoord} ${startCurveOuterCoord} ${startCurveEndCoord}`;

    const endCurveStartPoint = putPointOnLine(
      connectorX + endCurveOffset * 2,
      connectorY,
      srcX + startCurveOffset,
      srcY,
      sizes['--link-curve-radius'],
    );
    const endCurveStartCoord = `${endCurveStartPoint.x},${endCurveStartPoint.y}`;
    const endCurveOuterCoord = `${connectorX +
      endCurveOffset * 2},${connectorY}`;
    const endCurveEndCoord = `${connectorX + endCurveOffset},${connectorY}`;
    const pathEnd = `L${endCurveStartCoord} C${endCurveOuterCoord} ${endCurveOuterCoord} ${endCurveEndCoord} L${connectorX},${connectorY}`;

    const path = `${pathStart} ${pathEnd}`;

    const gapWidth = sizes['--endpoint-width'] + sizes['--endpoint-h-padding'];
    const gapsBetweenEndpoints = Math.abs(
      (dstEndpointX - srcEndpointX) / gapWidth,
    );

    const arrows = [];
    const arrowLineIntersect = lineIntersect.bind(
      null,
      startCurveEndPoint.x,
      startCurveEndPoint.y,
      endCurveStartPoint.x,
      endCurveStartPoint.y,
    );
    const interY = 9999999999;
    if (gapsBetweenEndpoints === 0) {
      const interX =
        endCurveStartPoint.x - sizes['--ingress-connector-padding'] / 3.5;
      arrows.push(arrowLineIntersect(interX, -interY, interX, interY));
    } else {
      const offset = isDSTEndpointLeftFromSRCEndpoint ? -gapWidth : gapWidth;
      let interX = isDSTEndpointLeftFromSRCEndpoint
        ? startCurveEndPoint.x - sizes['--ingress-connector-padding'] * 1.5
        : startCurveEndPoint.x + sizes['--ingress-connector-padding'] * 1.5;
      for (let i = 1; i <= gapsBetweenEndpoints; i += 1, interX += offset) {
        arrows.push(arrowLineIntersect(interX, -interY, interX, interY));
      }
    }

    return (
      <g>
        <path
          d={path}
          strokeWidth={sizes['--link-width']}
          className={css.link}
          fill="none"
        />
        {arrows.map(({ x: arrowToX, y: arrowToY }) => (
          <LinkArrow
            key={`${startCurveEndPoint.x}:${startCurveEndPoint.y}:${arrowToX}:${arrowToY}`}
            srcX={startCurveEndPoint.x}
            srcY={startCurveEndPoint.y}
            dstX={arrowToX}
            dstY={arrowToY}
          />
        ))}
      </g>
    );
  }
});

LinkFromEndpointToConnector.displayName = 'LinkFromEndpointToConnector';
