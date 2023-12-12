import React, { useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import * as d3 from 'd3';

import { XY } from '~/domain/geometry';

import { MapUtils } from '~/utils/iter-tools/map';
import { AccessPointArrow } from '~/ui-layer/service-map/coordinates/arrow';
import { sizes } from '~/ui';
import { colors } from '~/ui/vars';

import { ArrowRendererProps } from '~/components/ArrowsRenderer';
import { Teleport } from '~/components/Teleport';

import * as helpers from './helpers';
import css from './styles.scss';
import { reactionRef } from '~/ui/react/refs';

export type Props = Omit<ArrowRendererProps, 'arrow'> & {
  arrows: Map<string, AccessPointArrow>;
  connectorId: string;
};

export const ServiceMapArrowDuckFeet = observer(function ServiceMapArrowDuckFeet(props: Props) {
  const connectorCapRef = reactionRef<SVGGElement | null>(null, e => {
    renderEndingConnectorCap(e, props.connectorId, props.arrows);
  });
  const innerArrowsRef = reactionRef<SVGGElement | null>(null, e => {
    renderInnerArrows(e, props.arrows);
  });

  const renderEndingConnectorCap = useCallback(
    (target: SVGGElement | null, connectorId: string, arrows: Map<string, AccessPointArrow>) => {
      const connectorPosition = MapUtils.pickFirst(arrows)?.start;
      if (connectorPosition == null) return;

      // NOTE: It's important to use data key function returning smth that not
      // NOTE: depend on start plate position
      const endingConnector = d3
        .select(target)
        .selectAll<SVGCircleElement, XY>('circle.ending-connector')
        .data([connectorPosition], _ => `${connectorId}-ending-connector`);

      endingConnector.attr('cx', d => d.x).attr('cy', d => d.y);

      endingConnector
        .enter()
        .append('circle')
        .attr('class', 'ending-connector')
        .attr('fill', colors.connectorFill)
        .attr('stroke', colors.connectorStroke)
        .attr('stroke-width', sizes.connectorWidth)
        .attr('r', 7.5)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      endingConnector.exit().remove();
    },
    [],
  );

  const renderInnerArrows = useCallback(
    (target: SVGGElement | null, arrows: Map<string, AccessPointArrow>) => {
      const apArrows = [...arrows.values()];
      const innerArrowsElem = target;
      if (innerArrowsElem == null) {
        return;
      }

      // NOTE: Every line connecting outer connector and access point connector
      // NOTE: in fact comprises of two lines: foreground (visible) part and
      // NOTE: background blured part, which ensures that line will be
      // NOTE: distinguishable (visible) on backgrounds that is very close
      // NOTE: to line in the meaning of color.
      const backgroundLines = d3
        .select(innerArrowsElem)
        .selectAll<SVGLineElement, AccessPointArrow>('line.' + css.outerInnerLine)
        .data(apArrows, arr => `outer-${arr.id}-${Array.from(arr.verdicts).join(',')}`);

      // NOTE: It't important to keep verdicts in key function, otherwise the arrow
      // will not be rerendered
      const foregroundLines = d3
        .select(innerArrowsElem)
        .selectAll<SVGLineElement, AccessPointArrow>('line.inner')
        .data(apArrows, arr => `inner-${arr.id}-${Array.from(arr.verdicts).join(',')}`);

      const padlocks = d3
        .select(innerArrowsElem)
        .selectAll<SVGTextElement, AccessPointArrow>('text.padlock')
        .data(apArrows, arr => `padlock-${arr.id}-${Array.from(arr.verdicts).join(',')}`);

      // console.log(backgroundLines, foregroundLines, apArrows);
      backgroundLines.call(helpers.innerArrows.setBeginningAndEndCoords);
      foregroundLines.call(helpers.innerArrows.setBeginningAndEndCoords);

      backgroundLines
        .enter()
        .append('line')
        .attr('class', css.outerInnerLine)
        .attr('stroke-width', self => helpers.innerArrows.strokeWidth(self) + 2)
        .call(helpers.innerArrows.setBeginningAndEndCoords);

      foregroundLines
        .enter()
        .append('line')
        .attr('class', 'inner')
        .attr('stroke', helpers.innerArrows.strokeColor)
        .attr('stroke-width', helpers.innerArrows.strokeWidth)
        .attr('stroke-dasharray', helpers.innerArrows.strokeStyle)
        .attr('stroke-linecap', 'round')
        .call(helpers.innerArrows.setBeginningAndEndCoords);

      const padlockTooltip = d3
        .select('body')
        .append('div')
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('visibility', 'hidden')
        .style('color', '#fff')
        .style('background', '#000')
        .style('border-radius', '3px')
        .style('font-size', '12px')
        .style('line-height', '14px')
        .style('padding', '1px 3px')
        .text('Mutual auth enabled');

      padlocks.attr('x', arrow => arrow.end!.x - 8).attr('y', arrow => arrow.end!.y - 20);

      padlocks
        .enter()
        .append('text')
        .attr('class', 'padlock')
        .attr('title', 'Mutual auth enabled')
        .attr('font-family', 'blueprint-icons-16')
        .attr('color', a => (a.isEncrypted ? colors.padlockGreen : colors.feetNeutralStroke))
        .attr('x', arrow => arrow.end!.x - 8)
        .attr('y', arrow => arrow.end!.y - 20)
        .text((arrow: AccessPointArrow) => (arrow.hasAuth ? '\uf232' : ''))
        .on('mouseover', () => padlockTooltip.style('visibility', 'visible'))
        .on('mousemove', evt => {
          return padlockTooltip
            .style('top', evt.pageY - 10 + 'px')
            .style('left', evt.pageX + 10 + 'px');
        })
        .on('mouseout', () => {
          return padlockTooltip.style('visibility', 'hidden');
        });

      backgroundLines.exit().remove();
      foregroundLines.exit().remove();
      padlocks.exit().remove();
    },
    [],
  );

  const classes = classnames('arrow-duckfeet', props.connectorId);

  return (
    <Teleport to={props.arrowsForeground}>
      <g className={classes}>
        <g className="arrows-to-access-points" ref={innerArrowsRef}></g>
        <g className="connector-cap" ref={connectorCapRef}></g>
      </g>
    </Teleport>
  );
});
