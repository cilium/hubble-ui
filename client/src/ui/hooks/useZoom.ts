import * as d3 from 'd3';
import * as React from 'react';

type SVGRef = React.RefObject<SVGSVGElement>;

export interface Initials {
  scale?: number;
  tx?: number;
  ty?: number;
}

export const useZoom = (ref: SVGRef, initials?: Initials) => {
  const [
    zoomTransform,
    setZoomTransform,
  ] = React.useState<d3.ZoomTransform | null>(null);

  initials = initials || { scale: 0.5, tx: undefined, ty: undefined };

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    const width = ref.current.clientWidth;
    const height = ref.current.clientHeight;

    const initialTx = initials!.tx || width / 4;
    const initialTy = initials!.ty || height / 2;
    const initialScale = initials!.scale || 0.5;

    const initialTransform = d3.zoomIdentity
      .scale(initialScale)
      .translate(initialTx, initialTy);

    const zoom = d3
      .zoom()
      .scaleExtent([0.25, 2])
      .on('zoom', function handleZoom() {
        setZoomTransform(d3.event.transform);
      });

    const zooming = d3
      .select(ref.current)
      .attr('cursor', 'grab')
      .call(zoom as any);

    // Dirty hack for tests: jsdom doesn't have full svg support
    // https://github.com/jsdom/jsdom/issues/2531
    if (process.env.NODE_ENV !== 'test') {
      zooming.call(zoom.transform as any, initialTransform);
    }

    return () => {
      if (ref.current) {
        d3.select(ref.current)
          .selectAll('*')
          .remove();
      }
    };
  }, []);

  return zoomTransform;
};
