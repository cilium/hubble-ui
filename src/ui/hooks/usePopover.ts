import { PopoverProps } from '@blueprintjs/core';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export function usePopover({
  preventDefault = true,
  stopPropagation = true,
  popoverProps,
}: {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  popoverProps?: PopoverProps;
} = {}) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement>();
  const [popoverDiv, setPopoverDiv] = useState<HTMLElement | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  useLayoutEffect(() => {
    const portal = document.getElementById('alerts-portal');
    if (portal) setPortalContainer(portal);
  }, []);

  const onClose = useCallback(
    (event?: React.SyntheticEvent) => {
      stopPropagation && event?.stopPropagation();
      preventDefault && event?.preventDefault();
      setIsOpen(false);
    },
    [stopPropagation, preventDefault],
  );

  const onOpen = useCallback(
    (event?: React.SyntheticEvent) => {
      stopPropagation && event?.stopPropagation();
      preventDefault && event?.preventDefault();
      setIsOpen(true);
    },
    [stopPropagation, preventDefault],
  );

  const onToggle = useCallback(
    (event?: React.SyntheticEvent) => {
      stopPropagation && event?.stopPropagation();
      preventDefault && event?.preventDefault();
      setIsOpen(prevState => !prevState);
    },
    [stopPropagation, preventDefault],
  );

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!event.target || !popoverDiv) return;
      const target = event.target as Element;
      if (popoverDiv.contains(target)) return;
      onClose();
    };
    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  }, [popoverDiv]);

  return {
    isOpen,
    close: onClose,
    open: onOpen,
    toggle: onToggle,
    props: {
      isOpen,
      onClose,
      portalContainer,
      boundary: 'window',
      popoverRef: setPopoverDiv,
      ...popoverProps,
    } as PopoverProps,
  };
}
