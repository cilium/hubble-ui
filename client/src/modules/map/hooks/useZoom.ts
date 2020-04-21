import * as d3 from 'd3';
import * as React from 'react';

export function useZoom(ref: React.RefObject<SVGSVGElement>) {
  const [
    zoomTransform,
    setZoomTransform,
  ] = React.useState<d3.ZoomTransform | null>(null);

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    const width = ref.current.clientWidth;
    const height = ref.current.clientHeight;

    const initialTransform = d3.zoomIdentity
      .translate(width / 4, height / 2)
      .scale(0.5);

    const zoom = d3
      .zoom()
      .scaleExtent([0.25, 2])
      .on('zoom', function handleZoom() {
        setZoomTransform(d3.event.transform);
      });

    d3.select(ref.current)
      .attr('cursor', 'grab')
      .call(zoom as any)
      .call(zoom.transform as any, initialTransform);

    return () => {
      if (ref.current) {
        d3.select(ref.current)
          .selectAll('*')
          .remove();
      }
    };
  }, []);

  return zoomTransform;
}