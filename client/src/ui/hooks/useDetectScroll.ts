import { useEffect, useCallback, useState } from 'react';

export function useDetectScroll(element?: Element | null) {
  const [timerId, setTimerId] = useState<any>(0);
  const [isScrollingNow, setIsScrolling] = useState(false);

  const onScroll = useCallback(() => {
    clearTimeout(timerId);
    setIsScrolling(true);

    const tid = setTimeout(() => {
      setIsScrolling(false);
    }, 100);

    setTimerId(tid);
  }, []);

  useEffect(() => {
    if (!element) {
      return;
    }

    element.addEventListener('scroll', onScroll);

    return () => {
      clearTimeout(timerId);
      element.removeEventListener('scroll', onScroll);
    };
  }, [element]);

  return isScrollingNow;
}
