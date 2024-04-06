import * as d3 from 'd3';
import { XY } from '~/domain/geometry';

export const setupHovering = <S extends d3.Selection<any, any, any, any>>(
  self: S,
  housingElement: Element | undefined | null,
  onHoverState: (s: boolean, self: S) => void,
): typeof self => {
  let isMouseOver = false;

  self
    .on('mouseover', e => {
      if (isMouseOver) return;
      isMouseOver = true;

      onHoverState(true, self);
    })
    .on('mouseout', e => {
      if (housingElement != null) {
        if (housingElement.contains(e.relatedTarget)) return;
      }

      if (!isMouseOver) return;
      isMouseOver = false;

      onHoverState(false, self);
    });

  return self;
};

export const translateStr = (xy?: XY | null): string => {
  return xy == null ? '' : `translate(${xy.x}, ${xy.y})`;
};
