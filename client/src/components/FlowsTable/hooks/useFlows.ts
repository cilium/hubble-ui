import { useEffect, useRef, useState } from 'react';
import { Flow } from '~/domain/flows';
import { sizes } from '~/ui';
import { useDetectScroll } from '~/ui/hooks/useDetectScroll';

export function useFlows<E extends HTMLElement>(nextFlows: Flow[]) {
  const ref = useRef<E>(null);
  const scrolling = useDetectScroll(ref.current);

  const [flows, setFlows] = useState(nextFlows);

  useEffect(() => {
    setFlows(nextFlows);
    const diff = nextFlows.length - flows.length;
    setTimeout(() => {
      if (ref.current) {
        scroll({
          element: ref.current,
          offset: diff * sizes.flowsTableRowHeight,
          scrolling: scrolling.current,
        });
      }
    });
  }, [nextFlows]);

  return { ref, flows };
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
    element.scrollTo({
      top: element.scrollTop + offset,
      behavior: 'smooth',
    });
  }
}
