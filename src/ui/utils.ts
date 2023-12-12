import { XY } from '~/domain/geometry';

// NOTE: converts client coords to page coords
export const toPageCoords = (xy: XY): XY => {
  const body = document.body;
  const docEl = document.documentElement;

  const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
  const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

  const clientTop = docEl.clientTop || body.clientTop || 0;
  const clientLeft = docEl.clientLeft || body.clientLeft || 0;

  const x = xy.x + scrollLeft - clientLeft;
  const y = xy.y + scrollTop - clientTop;

  return { x, y };
};
