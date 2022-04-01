import React, { useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import classnames from 'classnames';
import * as d3 from 'd3';

import { XY } from '~/domain/geometry';
import { ServiceMapArrow, AccessPointArrow } from '~/domain/layout/service-map';

import { ArrowRendererProps } from '~/components/ArrowsRenderer';
import { colors, sizes } from '~/ui/vars';

import * as helpers from './helpers';
import { autorun } from 'mobx';

export type Props = ArrowRendererProps & {};

export const ServiceMapArrowRenderer = observer(
  function ServiceMapArrowRenderer(props: Props) {
    const trajectoryGroup = useRef<SVGGElement | null>(null);
    const handlesGroup = useRef<SVGGElement | null>(null);
    const endingFigures = useRef<SVGGElement | null>(null);
    const innerArrows = useRef<SVGGElement | null>(null);

    const renderArrow = useCallback((arrow: ServiceMapArrow) => {
      // NOTE: Here we use data bind with one element in array just to have
      // NOTE: an access to enter/update sets (see d3 General Update Pattern).
      const path = d3
        .select(trajectoryGroup.current!)
        .selectAll<SVGPathElement, ServiceMapArrow>('path')
        .data([arrow], d => d.id);

      // NOTE: d3 Update set is handled here
      path.attr('d', d => helpers.svg.arrowLinePath(d.points));

      path
        .enter()
        .append('path')
        .attr('class', 'line')
        .attr('stroke', colors.arrowStroke)
        .attr('stroke-width', sizes.linkWidth)
        .attr('fill', 'none')
        .attr('d', d => helpers.svg.arrowLinePath(d.points));

      path.exit().remove();
    }, []);

    // TODO: Maybe it's worth to find a way not to render arrow handles right
    // TODO: under other cards if handle coordinates are calculated that way.
    const renderHandles = useCallback((arrow: ServiceMapArrow) => {
      const handles = helpers.collectHandles(arrow);

      const paths = d3
        .select(handlesGroup.current!)
        .selectAll<SVGPathElement, helpers.ArrowHandle>('path')
        .data(handles, h => helpers.arrowHandleId(h, arrow));

      // NOTE: d3 Update set is handled here
      paths.attr('d', helpers.svg.arrowHandlePath);

      paths
        .enter()
        .append('path')
        .attr('class', 'handle')
        .attr('fill', colors.arrowHandle)
        .attr('stroke', 'none')
        .attr('d', helpers.svg.arrowHandlePath);

      paths.exit().remove();
    }, []);

    const renderStartPlate = useCallback((arrow: ServiceMapArrow) => {
      if (!arrow.start) return;

      // NOTE: It's important to use data key function returning smth that not
      // NOTE: depend on start plate position
      const startPlate = d3
        .select(endingFigures.current!)
        .selectAll<SVGPathElement, XY>('path.start-plate')
        .data([arrow.start], _ => `${arrow.id}-start-plate`);

      startPlate.attr('d', helpers.svg.startPlatePath);

      startPlate
        .enter()
        .append('path')
        .attr('class', 'start-plate')
        .attr('fill', colors.startPlateFill)
        .attr('stroke', colors.startPlateStroke)
        .attr('stroke-width', sizes.linkWidth)
        .attr('d', helpers.svg.startPlatePath);

      startPlate.exit().remove();
    }, []);

    const renderEndingConnector = useCallback((arrow: ServiceMapArrow) => {
      if (!arrow.end) return;

      // NOTE: It's important to use data key function returning smth that not
      // NOTE: depend on start plate position
      const endingConnector = d3
        .select(endingFigures.current!)
        .selectAll<SVGCircleElement, XY>('circle.ending-connector')
        .data([arrow.end], _ => `${arrow.id}-ending-connector`);

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
    }, []);

    const renderInnerArrows = useCallback((arrow: ServiceMapArrow) => {
      if (arrow.end == null) return;
      const apArrows = [...arrow.accessPointArrows.values()];

      // NOTE: Every line connecting outer connector and access point connector
      // NOTE: in fact comprises of two lines: foreground (visible) part and
      // NOTE: background blured part, which ensures that line will be
      // NOTE: distinguishable (visible) on backgrounds that is very close
      // NOTE: to line in the meaning of color.
      const backgroundLines = d3
        .select(innerArrows.current!)
        .selectAll<SVGLineElement, AccessPointArrow>('line.outer')
        .data(apArrows, arr => `outer-${arr.id}`);

      const foregroundLines = d3
        .select(innerArrows.current!)
        .selectAll<SVGLineElement, AccessPointArrow>('line.inner')
        .data(apArrows, arr => `inner-${arr.id}`);

      backgroundLines.call(self =>
        helpers.innerArrows.setPosition(self, arrow.end!),
      );
      foregroundLines.call(self =>
        helpers.innerArrows.setPosition(self, arrow.end!),
      );

      backgroundLines
        .enter()
        .append('line')
        .attr('class', 'outer')
        .attr('stroke-width', sizes.feetOuterWidth)
        .attr('stroke', colors.feetOuterStroke)
        .call(self => helpers.innerArrows.setPosition(self, arrow.end!));

      foregroundLines
        .enter()
        .append('line')
        .attr('class', 'inner')
        .attr('stroke', helpers.innerArrows.strokeColor)
        .attr('stroke-width', sizes.feetInnerWidth)
        .attr('stroke-dasharray', helpers.innerArrows.strokeStyle)
        .call(self => helpers.innerArrows.setPosition(self, arrow.end!));

      backgroundLines.exit().remove();
      foregroundLines.exit().remove();
    }, []);

    // TODO: check if fine-grained control can be implemented over rendering of
    // TODO: all parts of arrow separately
    // NOTE: This is an entry point of rendering this arrow.
    autorun(() => {
      if (!trajectoryGroup.current || !handlesGroup.current) return;
      if (!endingFigures.current || !innerArrows.current) return;
      if (!(props.arrow instanceof ServiceMapArrow)) return;

      renderArrow(props.arrow);
      renderHandles(props.arrow);
      renderStartPlate(props.arrow);
      renderEndingConnector(props.arrow);
      renderInnerArrows(props.arrow);
    });

    const classes = classnames('arrow', props.arrow.id);

    return (
      <g className={classes}>
        <g className="trajectory" ref={trajectoryGroup}></g>
        <g className="triangle-handles" ref={handlesGroup}></g>
        <g className="arrows-to-access-points" ref={innerArrows}></g>
        <g className="ending-figures" ref={endingFigures}></g>
      </g>
    );
  },
);
