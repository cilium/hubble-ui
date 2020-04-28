import { useEffect, useRef } from 'react';

export function useDetectScroll(element?: Element | null) {
  const scrollTimeout = useRef<any>();
  const scrolling = useRef(false);

  useEffect(() => {
    if (!element) {
      return;
    }
    const onScroll = () => {
      clearInterval(scrollTimeout.current);
      scrolling.current = true;
      scrollTimeout.current = setTimeout(() => {
        scrolling.current = false;
      }, 100);
    };
    element.addEventListener('scroll', onScroll);
    return () => {
      clearInterval(scrollTimeout.current);
      element.removeEventListener('scroll', onScroll);
    };
  }, [element]);

  return scrolling;
}
