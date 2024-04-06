import React, { useRef, useEffect, MutableRefObject } from 'react';
import { FixedSizeListProps } from 'react-window';

import { sizes } from '~/ui';

export type OnFlowsDiffCount = MutableRefObject<((diff: number) => void) | undefined>;

export function useScroll(onFlowsDiffCount?: OnFlowsDiffCount): Partial<FixedSizeListProps> {
  const outerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!onFlowsDiffCount) return;

    onFlowsDiffCount.current = diff => {
      if (!outerRef.current) return;

      scroll({
        element: outerRef.current,
        offset: diff * sizes.flowsTableRowHeight,
      });
    };

    return () => {
      onFlowsDiffCount.current = () => void 0;
    };
  }, [onFlowsDiffCount]);

  return { outerRef };
}

function scroll({ element, offset }: { element: Element | undefined | null; offset: number }) {
  if (!element || element.scrollTop === 0) return;
  element.scrollTop += offset;
}
