import React, { useMemo, useState, useEffect } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

// import { LinkFromEndpointToConnector } from './components/LinkFromEndpointToConnector';
// import { MapGraph } from './entities';

import { useZoom } from '~/ui/hooks/useZoom';
import { setCSSVars } from '~/ui';
import { Flow } from '~/domain/data';
import { Endpoint } from '~/domain/endpoint';
import { dummy as geom } from '~/domain/geometry';
import { sizes } from '~/ui/vars';
import { useStore } from '~/store/hooks';

import {
  EndpointCardBackplate,
  EndpointCardContent,
} from '~/components/EndpointCard';

import css from './styles.scss';

export interface Props {
  readonly flows: Array<Flow>;
  readonly endpoints: Array<Endpoint>;
  readonly namespace: string | undefined;
}

const MapComponent = (props: Props) => {
  const ref = React.useRef<SVGSVGElement>(null);
  const zoomProps = useZoom(ref, { tx: sizes.endpointHPadding });
  const [nsXYWH, setNsXYWH] = useState(geom.xywh());
  const { layout } = useStore();

  const updateNamespaceLayer = () => {
    const nsBBox = layout.cardsBBox.addMargin(sizes.endpointHPadding / 2);
    setNsXYWH(nsBBox);
  };

  const onCardHeightChange = (_: any, newHeight: number) => {
    updateNamespaceLayer();
  };

  useEffect(() => {
    updateNamespaceLayer();
  }, [zoomProps]);

  const placement = layout.placement;

  const NamespaceBackplate = props.namespace != null && (
    <g
      className={css.namespaceBackplate}
      transform={`translate(${nsXYWH.x}, ${nsXYWH.y})`}
    >
      <rect width={nsXYWH.w} height={nsXYWH.h} rx={10} ry={10} />
      <text
        x={sizes.endpointHPadding / 2 + sizes.endpointShadowSize}
        y={sizes.endpointHPadding / 3}
      >
        {props.namespace}
      </text>
    </g>
  );

  return (
    <svg ref={ref} className={css.wrapper}>
      <g transform={zoomProps ? zoomProps.toString() : ''}>
        {NamespaceBackplate}

        {placement.map(props => (
          <EndpointCardBackplate
            key={props.endpoint.id!}
            coords={props.geometry}
            endpoint={props.endpoint}
            onHeightChange={h => onCardHeightChange(props, h)}
          />
        ))}

        {placement.map(props => (
          <EndpointCardContent
            key={props.endpoint.id!}
            coords={props.geometry}
            endpoint={props.endpoint}
            onHeightChange={h => onCardHeightChange(props, h)}
          />
        ))}

        {/*{layout.mapEachLink(props => (
          <LinkFromEndpointToConnector
            {...props}
            key={props.srcEndpoint.hash + props.dstEndpoint.hash}
            connectorX={props.dstEndpointX - 30}
            connectorY={props.dstEndpointY + 30}
          />
        ))}*/}
      </g>
    </svg>
  );
};

export const Map = React.memo(MapComponent);
