import React, { useMemo, useState, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

import { useZoom } from '~/ui/hooks/useZoom';
import { setCSSVars } from '~/ui';
import { Flow } from '~/domain/data';
import { Endpoint } from '~/domain/endpoint';
import { dummy as geom } from '~/domain/geometry';
import { sizes } from '~/ui/vars';
import { useStore } from '~/store/hooks';
import { XYWH } from '~/domain/geometry';
import { Placement, PlacementEntry } from '~/domain/layout';

import {
  EndpointCardBackplate,
  EndpointCardContent,
} from '~/components/EndpointCard';

import { NamespaceBackplate } from './NamespaceBackplate';

import css from './styles.scss';

export interface Props {
  readonly flows: Array<Flow>;
  readonly endpoints: Array<Endpoint>;
  readonly namespace: string | undefined;
}

export interface MapElementsProps {
  namespace: string | undefined;
}

const MapElements = React.memo(function MapElements(props: MapElementsProps) {
  const { layout } = useStore();
  const { namespace } = props;
  const [nsXYWH, setNsXYWH] = useState(geom.xywh());

  const placement = useMemo(() => layout.placement, [layout]);

  const updateNamespaceLayer = useCallback(() => {
    const nsBBox = layout.cardsBBox.addMargin(sizes.endpointHPadding / 2);
    setNsXYWH(nsBBox);
  }, []);

  return (
    <>
      <NamespaceBackplate namespace={namespace} xywh={nsXYWH} />

      {placement.map(card => (
        <EndpointCardBackplate
          key={card.endpoint.id!}
          coords={card.geometry}
          endpoint={card.endpoint}
          onHeightChange={h => updateNamespaceLayer()}
        />
      ))}

      {placement.map(card => (
        <EndpointCardContent
          key={card.endpoint.id!}
          coords={card.geometry}
          endpoint={card.endpoint}
          onHeightChange={h => updateNamespaceLayer()}
        />
      ))}
    </>
  );
});

const MapComponent = (props: Props) => {
  const ref = React.useRef<SVGSVGElement>(null);
  const zoomProps = useZoom(ref, { tx: sizes.endpointHPadding });

  return (
    <svg ref={ref} className={css.wrapper}>
      <g transform={zoomProps ? zoomProps.toString() : ''}>
        <MapElements namespace={props.namespace} />
      </g>
    </svg>
  );
};

export const Map = React.memo(MapComponent);
