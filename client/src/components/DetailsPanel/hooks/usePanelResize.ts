import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { sizes } from '~/ui/vars';

type HookData = [{ top: string }, (dy: number) => void];

const LS_POS_KEY = '@hubble-ui/panel-position';

export const usePanelResize = (
  rootRef: MutableRefObject<HTMLDivElement | null>,
): HookData => {
  const lsPosition = localStorage.getItem(LS_POS_KEY);
  const initialPosition = lsPosition ? +lsPosition : 0.66;
  const [panelTop, setPanelTop] = useState(initialPosition);

  const topBarThreshold = useMemo(() => {
    return sizes.topBarHeight / window.innerHeight;
  }, []);

  useEffect(() => {
    if (rootRef.current == null) return;
    const bbox = rootRef.current.getBoundingClientRect();

    setPanelTop(1 - bbox.y / window.innerHeight);
  }, [rootRef.current]);

  useEffect(() => {
    localStorage.setItem(LS_POS_KEY, String(panelTop));
  }, [panelTop]);

  const onResize = useCallback((dy: number) => {
    if (rootRef.current == null) return;
    const bbox = rootRef.current.getBoundingClientRect();

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
