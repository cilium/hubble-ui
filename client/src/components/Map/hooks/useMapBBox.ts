import { useMemo } from 'react';
import { XYWH } from '~/domain/geometry';
import { Placement } from '~/domain/layout';

export function useMapBBox(placements: Placement, namespaceBBox: XYWH): XYWH {
  return useMemo(() => {
    let width = namespaceBBox ? namespaceBBox.w : 0;
    let height = namespaceBBox ? namespaceBBox.h : 0;
    let x = namespaceBBox ? namespaceBBox.x : 0;
    let y = namespaceBBox ? namespaceBBox.y : 0;

    placements.forEach(placement => {
      width = Math.max(width, placement.geometry.x + placement.geometry.w);
      height = Math.max(height, placement.geometry.y + placement.geometry.h);
      x = Math.min(x, placement.geometry.x);
      y = Math.min(y, placement.geometry.y);
    });

    return new XYWH(x, y, width, height);
  }, [placements, namespaceBBox]);
}
