import React, { useCallback, useLayoutEffect, useRef } from 'react';

import _ from 'lodash';

import { toPageCoords } from '~/ui/utils';
import { XY } from '~/domain/geometry';

export interface DragCoords {
  diff: {
    x: number;
    y: number;
  };
  client: {
    press: XY;
    current: XY;
    release?: XY | null;
  };
  page?: {
    press: XY;
    current: XY;
    release?: XY | null;
  };
}

export interface DragFlags {
  isStart: boolean;
  isEnd: boolean;
  isMoving: boolean;
}

export interface Options {
  pageCoords?: boolean;
  throttling?: number;
}

export const useMouseDrag = (
  elemRef: React.RefObject<HTMLElement | null>,
  opts: Options | null,
  cb: (coords: DragCoords, flags: DragFlags) => void | Promise<void>,
) => {
  const pageCoords = !!opts?.pageCoords;
  const pressCoords = useRef<XY | null>(null);
  const releaseCoords = useRef<XY | null>(null);
  const currentCoords = useRef<XY | null>(null);

  const reset = useCallback(() => {
    pressCoords.current = null;
    releaseCoords.current = null;
    currentCoords.current = null;
  }, []);

  const emit = useCallback(
    _.throttle((press: XY | null, current: XY | null, release: XY | null) => {
      if (press == null || current == null) return;

      const prevCurrent = currentCoords.current;
      const diff =
        prevCurrent != null && press == pressCoords.current
          ? {
              x: prevCurrent.x - current.x,
              y: prevCurrent.y - current.y,
            }
          : {
              x: 0,
              y: 0,
            };

      pressCoords.current = press;
      currentCoords.current = current;
      releaseCoords.current = release;

      const p = cb(
        {
          diff,
          client: {
            press: press,
            current: current,
            release: release,
          },
          page: pageCoords
            ? {
                press: toPageCoords(press),
                current: toPageCoords(current),
                release: current != null ? toPageCoords(current) : null,
              }
            : void 0,
        },
        {
          isStart: press != null && press == current,
          isMoving: press != null && press != current && release == null,
          isEnd: release != null,
        },
      );

      if (release != null) {
        if (p instanceof Promise) {
          p.finally(() => {
            reset();
          });
        } else {
          reset();
        }
      }
    }, opts?.throttling ?? 0),
    [pressCoords.current, currentCoords.current, releaseCoords.current],
  );

  const onMouseMove = useCallback(
    (evt: MouseEvent) => {
      const newCurrent = { x: evt.clientX, y: evt.clientY };
      emit(pressCoords.current, newCurrent, null);
    },
    [emit, pressCoords.current],
  );

  const onMouseUp = useCallback(
    (evt: MouseEvent) => {
      const releasedOn = { x: evt.clientX, y: evt.clientY };
      emit(pressCoords.current, releasedOn, releasedOn);

      document.removeEventListener('mousemove', onMouseMove);
    },
    [onMouseMove, emit, pressCoords.current, currentCoords.current],
  );

  const onMouseDown = useCallback(
    (evt: MouseEvent) => {
      const pressedOn = { x: evt.clientX, y: evt.clientY };
      emit(pressedOn, pressedOn, null);

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp, { once: true });
    },
    [onMouseMove, pressCoords.current, emit],
  );

  useLayoutEffect(() => {
    if (elemRef.current == null) return;

    elemRef.current.addEventListener('mousedown', onMouseDown);

    return () => {
      elemRef.current?.removeEventListener('mousemove', onMouseMove);
      elemRef.current?.removeEventListener('mousedown', onMouseDown);
      elemRef.current?.removeEventListener('mouseup', onMouseUp);
    };
  }, [cb, elemRef.current, onMouseMove, onMouseDown, onMouseUp]);
};
