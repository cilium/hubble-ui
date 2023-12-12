import React, { useCallback, useEffect, useLayoutEffect } from 'react';

import { WH } from '~/domain/geometry';

export interface SizeWatcher {
  emitDimensions: () => void;
}

export const useSizeWatcher = (
  elemRef: React.RefObject<HTMLElement | null>,
  cb: (wh: WH) => void,
): SizeWatcher => {
  const emitDimensions = useCallback(() => {
    setTimeout(() => {
      if (!elemRef || !elemRef.current) return;

      // TODO: consider using throttling/debounce/fastdom
      const { width, height } = elemRef.current.getBoundingClientRect();
      cb({ w: width, h: height });
    }, 10);
  }, [elemRef.current]);

  useEffect(() => {
    if (elemRef.current == null) return;
    const observer = new MutationObserver(emitDimensions);

    observer.observe(elemRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [elemRef.current, emitDimensions]);

  useEffect(() => {
    emitDimensions();
  }, []);

  return { emitDimensions };
};
