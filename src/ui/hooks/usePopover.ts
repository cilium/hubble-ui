import { Popover } from '@blueprintjs/core';
import { useCallback, useEffect, useRef, useState } from 'react';

export function usePopover() {
  const [popoverDiv, setPopoverDiv] = useState<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const close = useCallback(() => setIsOpen(false), []);
  const open = useCallback(() => setIsOpen(true), []);
  const toggle = useCallback(() => setIsOpen(!isOpen), []);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!event.target || !popoverDiv) return;
      const target = event.target as Element;

      if (popoverDiv.contains(target)) return;
      close();
    };

    document.addEventListener('click', listener);

    return () => {
      document.removeEventListener('click', listener);
    };
  }, [popoverDiv]);

  return {
    isOpen,
    close,
    open,
    toggle,
    props: {
      popoverRef: setPopoverDiv,
      isOpen,
      onClose: close,
    },
  };
}
