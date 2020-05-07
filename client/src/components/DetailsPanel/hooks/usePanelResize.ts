import {
  MutableRefObject,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { sizes } from '~/ui/vars';

type HookData = [{ top: string }, (dy: number) => void];

export const usePanelResize = (
  rootRef: MutableRefObject<HTMLDivElement | null>,
  initialPanelTop: number,
): HookData => {
  const [panelTop, setPanelTop] = useState(initialPanelTop);

  const topBarThreshold = useMemo(() => {
    return sizes.topBarHeight / window.innerHeight;
  }, []);

  useEffect(() => {
    if (rootRef.current == null) return;
    const bbox = rootRef.current!.getBoundingClientRect();

    setPanelTop(1 - bbox.y / window.innerHeight);
  }, [rootRef.current]);

  const onResize = useCallback((dy: number) => {
    const bbox = rootRef.current!.getBoundingClientRect();

    const panelTop = bbox.y / window.innerHeight;
    const change = dy / window.innerHeight;
    const top = panelTop + change;

    // TODO: improve bottom threshold
    if (top < topBarThreshold || top > 1 - topBarThreshold) return;

    setPanelTop(top);
  }, []);

  const styles = { top: `${panelTop * 100}%` };
  return [styles, onResize];
};
