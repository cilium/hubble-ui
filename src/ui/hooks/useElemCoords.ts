import React, { useCallback, useEffect, useLayoutEffect } from 'react';

import { WH, XY, XYWH } from '~/domain/geometry';
import { tooSmall } from '~/domain/misc';

export interface ElemCoords {
  client: XYWH;
  dimensions: WH;
  position: XY;
  center: XY;
  scale: WH;
}

export interface ElemCoordsHandle {
  isOneShot: boolean;
  ref: React.RefObject<Element | null>;

  emit: () => void;
  getCoords: () => ElemCoords | null;
}

export const useElemCoords = (
  elemRef: React.RefObject<Element | null>,
  oneShot: boolean,
  cb: (coords: ElemCoords) => void,
): ElemCoordsHandle => {
  const getCoords = useCallback((): ElemCoords | null => {
    if (!elemRef || !elemRef.current) return null;

    // TODO: Consider using throttling/debounce/fastdom if this works too slow
    return getElemCoords(elemRef.current);
  }, [elemRef.current]);

  const emitCoords = useCallback(() => {
    setTimeout(() => {
      const coords = getCoords();
      if (coords == null) return;

      cb(coords);
    }, 0);
  }, [elemRef.current, getCoords, cb]);

  useLayoutEffect(() => {
    if (oneShot || elemRef.current == null) return;
    const observer = new MutationObserver(emitCoords);

    observer.observe(elemRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [oneShot, elemRef.current, emitCoords]);

  useLayoutEffect(() => {
    emitCoords();
  }, []);

  return {
    isOneShot: oneShot,
    ref: elemRef,

    emit: emitCoords,
    getCoords,
  };
};

export const getElemCoords = (elem: Element): ElemCoords => {
  if (elem instanceof HTMLElement) {
    const domRect = elem.getBoundingClientRect();
    const offsetWH = { w: elem.offsetWidth, h: elem.offsetHeight };

    return computeElemCoords(domRect, domRect, offsetWH);
  }

  // TODO: smth is wrong with such a differentiation and there is probably
  // TODO: no need to getBBox(), use getBoundingClientRect() instead
  if (elem instanceof SVGGraphicsElement) {
    return computeElemCoords(elem.getBBox(), elem.getBoundingClientRect());
  }

  const clientBBox = elem.getBoundingClientRect();
  return computeElemCoords(clientBBox, clientBBox);
};

export const computeElemCoords = (
  localBBox: DOMRect,
  clientBBox: DOMRect,
  offsetWH?: WH | null,
): ElemCoords => {
  const { width, height, left, top } = localBBox;

  const offsetWidth = offsetWH?.w ?? width;
  const offsetHeight = offsetWH?.h ?? height;

  const scaleW = tooSmall(width) || tooSmall(offsetWidth) ? 1 : width / offsetWidth;

  const scaleH = tooSmall(height) || tooSmall(offsetHeight) ? 1 : height / offsetHeight;

  if (Number.isNaN(scaleW) || Number.isNaN(scaleH)) debugger;

  return {
    client: XYWH.fromDOMRect(clientBBox),
    dimensions: { w: width, h: height },
    position: { x: left, y: top },
    center: { x: left + width / 2, y: top + height / 2 },
    scale: { w: scaleW, h: scaleH },
  };
};

export const applyScaleToXY = (target: XY, scaleWH?: WH | null): XY => {
  if (scaleWH == null) return target;

  return { x: target.x / scaleWH.w, y: target.y / scaleWH.h };
};

export const applyScaleToWH = (target: WH, scaleWH?: WH | null): WH => {
  if (scaleWH == null) return target;

  return { w: target.w / scaleWH.w, h: target.h / scaleWH.h };
};

export const zeroElemCoords = (x = 0, y = 0): ElemCoords => {
  return {
    client: XYWH.empty(),
    dimensions: { w: 0, h: 0 },
    position: { x, y },
    center: { x, y },
    scale: { w: 1, h: 1 },
  };
};
