import React, { useMemo, useState, useEffect, useCallback } from 'react';

import { observer } from 'mobx-react';
import * as d3 from 'd3';
import _ from 'lodash';

import {
  EndpointCardBackplate,
  EndpointCardContent,
} from '~/components/EndpointCard';
import { NamespaceBackplate } from './NamespaceBackplate';
import { ArrowsRenderer } from '~/components/ArrowsRenderer';

import { dummy as geom, XYWH, Vec2 } from '~/domain/geometry';
import { ServiceCard } from '~/domain/service-card';
import { Placement, PlacementEntry } from '~/domain/layout';
import { Interactions, Link } from '~/domain/service-map';

import { useStore } from '~/store/hooks';
import { useZoom } from '~/ui/hooks/useZoom';
import { sizes } from '~/ui/vars';

import css from './styles.scss';

export interface Props {
  services: Array<ServiceCard>;
  activeServices?: Set<string>;
  links?: Array<Link>;
  namespace: string | undefined;
  interactions?: Interactions;
  onServiceSelect?: (srvc: ServiceCard) => void;
  onEmitAPConnectorCoords?: (apId: string, coords: Vec2) => void;
}

export type MapElementsProps = Omit<Props, 'services'>;

export const MapElementsComponent = observer((props: MapElementsProps) => {
  const store = useStore();
  const { layout } = useStore();
  const { namespace } = props;
  const [nsXYWH, setNsXYWH] = useState(geom.xywh());

  const updateNamespaceLayer = useCallback(() => {
    const nsBBox = layout.cardsBBox.addMargin(sizes.endpointHPadding / 2);
    setNsXYWH(nsBBox);
  }, []);

  const onCardHeightChange = useCallback((card: ServiceCard, h: number) => {
    layout.setCardHeight(card.id, h);
    updateNamespaceLayer();
  }, []);

  const isCardActive = useCallback(
    (srvc: ServiceCard) => {
      const set = props.activeServices;
      const r = set == null ? false : set.has(srvc.id);

      return r;
    },
    [props.activeServices],
  );

  return (
    <>
      <NamespaceBackplate namespace={namespace} xywh={nsXYWH} />

      {layout.placement.map(plc => (
        <EndpointCardBackplate
          key={plc.serviceCard.id}
          coords={plc.geometry}
          card={plc.serviceCard}
          onHeightChange={onCardHeightChange}
        />
      ))}

      <ArrowsRenderer
        arrows={layout.connectionArrows}
        apPositions={layout.apCoords}
      />

      {layout.placement.map(plc => (
        <EndpointCardContent
          active={isCardActive(plc.serviceCard)}
          key={plc.serviceCard.id}
          coords={plc.geometry}
          card={plc.serviceCard}
          onHeightChange={onCardHeightChange}
          onHeaderClick={props.onServiceSelect}
          onEmitAPConnectorCoords={props.onEmitAPConnectorCoords}
        />
      ))}
    </>
  );
});

export const MapElements = React.memo(MapElementsComponent);

const MapComponent = (props: Props) => {
  const ref = React.useRef<SVGSVGElement>(null);
  const zoomProps = useZoom(ref, { tx: sizes.endpointHPadding });

  return (
    <svg ref={ref} className={css.wrapper}>
      <g transform={zoomProps ? zoomProps.toString() : ''}>
        <MapElements
          interactions={props.interactions}
          namespace={props.namespace}
          onServiceSelect={props.onServiceSelect}
          activeServices={props.activeServices}
          onEmitAPConnectorCoords={props.onEmitAPConnectorCoords}
        />
      </g>
    </svg>
  );
};

export const Map = React.memo(MapComponent);
