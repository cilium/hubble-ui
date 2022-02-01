import React, { useCallback, useLayoutEffect } from 'react';

import { WH, XY } from '~/domain/geometry';

export interface ElemCoords {
  dimensions: WH;
  position: XY;
  center: XY;
}

export interface ElemCoordsHandle {
  isOneShot: boolean;
  ref: React.RefObject<HTMLElement | null>;

  emit: () => void;
  getCoords: () => ElemCoords | null;
}

export const useElemCoords = (
  elemRef: React.RefObject<HTMLElement | null>,
  oneShot: boolean,
  cb: (coords: ElemCoords) => void,
): ElemCoordsHandle => {
  const getCoords = useCallback((): ElemCoords | null => {
    if (!elemRef || !elemRef.current) return null;

    // TODO: consider using throttling/debounce/fastdom if works slow
    const { width, height, left, top } =
      elemRef.current.getBoundingClientRect();

    return {
      dimensions: { w: width, h: height },
      position: { x: left, y: top },
      center: { x: left + width / 2, y: top + height / 2 },
    };
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
