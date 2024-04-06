import _ from 'lodash';
import * as React from 'react';

import { XY, WH, XYWH } from '~/domain/geometry';

import { ElemCoords } from './useElemCoords';
import { tooSmall } from '~/domain/misc';

// TODO: Stop using that ElemCoords, its not normal to calc `scale` field
export type IntersectBBoxCallback = (bbox: XYWH) => void;
export type IntersectElemCoordsCallback = (coords: ElemCoords) => void;

export type IntersectBBoxOptions = {
  elem: string | Element;
  root?: Document | Element | null;
  oneshot?: boolean;
};

export type IntersectBBoxHookOptions = Omit<IntersectBBoxOptions, 'elem'> & {
  ref: React.RefObject<Element | null>;
};

const getIntersectBBox = (opts: IntersectBBoxOptions, cb: IntersectBBoxCallback) => {
  const elem = opts.elem;
  const target = _.isString(elem) ? document.querySelector(elem) : _.isElement(elem) ? elem : null;

  if (target == null) {
    console.warn(`useIntersectBBox called on non-existing element`);
    return null;
  }

  const ob = new IntersectionObserver(
    entries => {
      const entry = entries.find(e => e.target == target);
      if (entry == null) return;

      cb(XYWH.fromDOMRect(entry.boundingClientRect));

      if (!!opts.oneshot) ob.disconnect();
    },
    {
      root: opts.root || null,
      threshold: [0.0, 1.0],
    },
  );

  ob.observe(target);
  return ob;
};

export const getIntersectBBoxAsync = async (opts: IntersectBBoxOptions): Promise<XYWH> => {
  return new Promise((resolve, reject) => {
    const ob = getIntersectBBox(opts, bbox => resolve(bbox));
    if (ob == null) {
      reject(new Error('useIntersectBBoxAsync called on non-existing element'));
    }
  });
};

export const useIntersectBBox = (opts: IntersectBBoxHookOptions, cb: IntersectBBoxCallback) => {
  React.useLayoutEffect(() => {
    if (opts.ref.current == null) return;

    const options = { ...opts, elem: opts.ref.current };
    const ob = getIntersectBBox(options, cb);

    return () => ob?.disconnect();
  }, []);
};

export const useIntersectElemCoords = (
  opts: IntersectBBoxHookOptions,
  cb: IntersectElemCoordsCallback,
) => {
  React.useLayoutEffect(() => {
    if (opts.ref.current == null) return;

    const options = { ...opts, elem: opts.ref.current };
    const ob = getIntersectBBox(options, bbox => {
      if (opts.ref.current == null) return;

      const elemCoords = prepareElemCoords(bbox, opts.ref.current);
      cb(elemCoords);
    });

    return () => ob?.disconnect();
  }, [opts.ref]);
};

const prepareElemCoords = (bbox: XYWH, elem: Element): ElemCoords => {
  const { w, h } = bbox;

  const offsetWH: WH =
    elem instanceof HTMLElement
      ? {
          w: elem.offsetWidth,
          h: elem.offsetHeight,
        }
      : {
          w: 1,
          h: 1,
        };

  const scale = {
    w: tooSmall(w) || tooSmall(offsetWH.w) ? 1 : w / offsetWH.w,
    h: tooSmall(h) || tooSmall(offsetWH.h) ? 1 : h / offsetWH.h,
  };

  return {
    client: bbox,
    dimensions: bbox.wh,
    position: bbox.xy,
    center: bbox.center,
    scale,
  };
};
