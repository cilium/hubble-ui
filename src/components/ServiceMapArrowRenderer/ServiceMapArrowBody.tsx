import React, { useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import classnames from 'classnames';
import * as mobx from 'mobx';
import * as d3 from 'd3';

import { XY } from '~/domain/geometry';
import { link } from '~/domain/helpers';

import { ArrowRendererProps } from '~/components/ArrowsRenderer';
import { ServiceMapArrow, AccessPointArrow } from '~/ui-layer/service-map/coordinates/arrow';
import { colors, sizes } from '~/ui/vars';

import * as helpers from './helpers';
import css from './styles.scss';

export type Props = ArrowRendererProps & {};

export const ServiceMapArrowBody = observer(function ServiceMapArrowBody(props: Props) {
  const trajectoryGroup = useRef<SVGGElement | null>(null);
  const handlesGroup = useRef<SVGGElement | null>(null);
  const endingFigures = useRef<SVGGElement | null>(null);
  const innerArrows = useRef<SVGGElement | null>(null);

  const arrow = mobx
    .computed(() => {
      if (!(props.arrow instanceof ServiceMapArrow)) return null;

      return props.arrow;
    })
    .get();

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
      .attr('class', 'handle ' + css.arrowHandle)
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

  useEffect(() => {
    if (!trajectoryGroup.current || !handlesGroup.current) return;
    if (!endingFigures.current) return;
    if (!(props.arrow instanceof ServiceMapArrow)) return;

    renderArrow(props.arrow);
    renderHandles(props.arrow);
    renderStartPlate(props.arrow);
  }, [props]);

  const classes = classnames('arrow-body', props.arrow.id);

  return (
    <g className={classes}>
      <g className="trajectory" ref={trajectoryGroup}></g>
      <g className="triangle-handles" ref={handlesGroup}></g>
      <g className="arrows-to-access-points" ref={innerArrows}></g>
      <g className="ending-figures" ref={endingFigures}></g>
    </g>
  );
});
