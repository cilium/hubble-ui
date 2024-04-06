import * as d3 from 'd3';
import { useEffect, useRef, useState, RefObject } from 'react';

import { sizes } from '~/ui/vars';
import { XYWH } from '~/domain/geometry';

export interface MapZoom {
  ref: RefObject<SVGSVGElement>;
  transform: string;
}

export interface Args {
  wasDragged?: boolean;
  onMapDrag?: (val: boolean) => void;
  mapBBox: XYWH;
  visibleHeight: number;
}

export function useMapZoom(args: Args): MapZoom {
  const ref = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(createTransformToCenter(args));
  const doTransform = useRef<((trans: d3.ZoomTransform) => void) | null>(null);
  const movesCount = useRef<number>(0);

  useEffect(() => {
    if (args.wasDragged === false) {
      movesCount.current = 0;
    }
  }, [args.wasDragged]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const initialTransform = createTransformToCenter(args);

    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 1.5])
      .on('zoom', event => {
        setTransform(event.transform);
        if (event.transform.programmatic) return;

        args.onMapDrag?.(movesCount.current++ > 1);
      });

    const zommable = d3
      .select(ref.current)
      .call(zoom as any)
      .on('dblclick.zoom', null);

    doTransform.current = transform => {
      (transform as any).programmatic = true;
      zommable.call(zoom.transform as any, transform);
    };

    // Dirty hack for tests: jsdom doesn't have full svg support
    // https://github.com/jsdom/jsdom/issues/2531
    if (process.env.NODE_ENV !== 'test') {
      doTransform.current(initialTransform);
    }

    return () => {
      if (ref.current) {
        d3.select(ref.current).selectAll('*').remove();
      }
    };
  }, []);

  // auto center map on updates until user makes a move
  useEffect(() => {
    if (!doTransform.current || movesCount.current > 1) return;
    doTransform.current(createTransformToCenter(args));
  }, [args.mapBBox]);

  return { transform: transform.toString(), ref };
}

function createTransformToCenter(args: Args) {
  const containerWidth = window.innerWidth;
  const containerHeight = Math.round(Math.max(window.innerHeight / 2, args.visibleHeight));
  const mapWidth = args.mapBBox.w || containerWidth;
  const mapHeight = args.mapBBox.h || containerHeight;
  const totalMapWidth = mapWidth + sizes.endpointHPadding * 2;
  const totalMapHeight = mapHeight + sizes.endpointVPadding * 2;

  const scale = Math.min(containerWidth / totalMapWidth, containerHeight / totalMapHeight);

  const scaledMapWidth = totalMapWidth * scale;
  const scaledMapHeight = totalMapHeight * scale;
  const scaledXOffset = (-args.mapBBox.x + sizes.endpointHPadding) * scale;
  const scaledYOffset = (-args.mapBBox.y + sizes.endpointVPadding) * scale;

  const x = scaledXOffset + (containerWidth - scaledMapWidth) / 2;
  const y = sizes.topBarHeight + scaledYOffset + (containerHeight - scaledMapHeight) / 2;

  return d3.zoomIdentity.translate(x, y).scale(scale);
}
