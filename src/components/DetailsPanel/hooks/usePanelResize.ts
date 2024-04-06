import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { sizes } from '~/ui/vars';

import * as storage from '~/storage/local';

export interface ResizeProps {
  panelTop: number;
  panelTopInPixels: number;
}

export const usePanelResize = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const lsPosition = storage.getDetailsPanelTop();
  const initialPosition = lsPosition ? +lsPosition : 0.66;
  const [panelTop, setPanelTop] = useState(initialPosition);

  const topBarThreshold = useMemo(() => {
    return sizes.topBarHeight / window.innerHeight;
  }, []);

  useEffect(() => {
    storage.setDetailsPanelTop(panelTop);
  }, [panelTop]);

  const props = useMemo(() => {
    return {
      panelTop,
      panelTopInPixels: panelTop * window.innerHeight,
    } as ResizeProps;
  }, [panelTop]);

  const onResize = useCallback((dy: number) => {
    if (ref.current == null) return;
    const bbox = ref.current.getBoundingClientRect();

    const panelTop = bbox.y / window.innerHeight;
    const change = dy / window.innerHeight;
    const top = panelTop + change;

    // TODO: improve bottom threshold
    if (top < topBarThreshold || top > 1 - topBarThreshold) return;

    setPanelTop(top);
  }, []);

  const style = useMemo(() => {
    return {
      top: `${panelTop * 100}%`,
    };
  }, [panelTop]);

  return { ref, style, onResize, props };
};
