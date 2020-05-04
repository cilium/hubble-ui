import { useEffect, useRef, useState } from 'react';
import { sizes } from '~/ui';
import { useDetectScroll } from '~/ui/hooks/useDetectScroll';

export function useScroll<E extends HTMLElement>(nextFlowsDiffCount: {
  value: number;
}) {
  const ref = useRef<E>(null);
  const scrolling = useDetectScroll(ref.current);
  const [flowsDiffCount, setFlowsDiffCount] = useState(nextFlowsDiffCount);

  useEffect(() => {
    if (nextFlowsDiffCount === flowsDiffCount) return;
    setFlowsDiffCount(flowsDiffCount);
    const timeout = setTimeout(() => {
      if (!ref.current) return;
      scroll({
        element: ref.current,
        offset: nextFlowsDiffCount.value * sizes.flowsTableRowHeight,
        scrolling: scrolling.current,
      });
    });
    return () => {
      clearTimeout(timeout);
    };
  }, [nextFlowsDiffCount]);

  return { ref };
}

function scroll({
  element,
  offset,
  scrolling,
}: {
  element: Element | undefined | null;
  offset: number;
  scrolling: boolean;
}) {
  if (!element || element.scrollTop === 0) {
    return;
  }
  if (scrolling) {
    element.scrollTop = element.scrollTop + offset;
  } else {
    element.scroll({
      top: element.scrollTop + offset,
      behavior: 'smooth',
    });
  }
}
