import React, { memo, useCallback } from 'react';

import { ArrowsRenderer } from '~/components/ArrowsRenderer';
import {
  EndpointCardBackplate,
  EndpointCardContent,
} from '~/components/EndpointCard';

import { Vec2, XYWH } from '~/domain/geometry';
import { Placement, SenderArrows } from '~/domain/layout';
import { ServiceCard } from '~/domain/service-card';
import { AccessPoints } from '~/domain/service-map';

import { sizes } from '~/ui/vars';

import { NamespaceBackplate } from './NamespaceBackplate';
import { useMapZoom } from './hooks/useMapZoom';
import { useMapBBox } from './hooks/useMapBBox';

import css from './styles.scss';

export interface Props {
  wasDragged: boolean;
  namespace: string | null;
  namespaceBBox: XYWH;
  placement: Placement;
  visibleHeight: number;
  arrows: Map<string, SenderArrows>;
  isCardActive: (id: string) => boolean;
  accessPoints: AccessPoints;
  accessPointsCoords: Map<string, Vec2>;
  onCardSelect: (srvc: ServiceCard) => void;
  onAccessPointCoords: (apId: string, coords: Vec2) => void;
  onCardHeightChange: (id: string, height: number) => void;
  onMapDrag?: (val: boolean) => void;
}

export const MapElements = memo(function MapElements(props: Props) {
  // prettier-ignore
  const onCardHeightChange = useCallback((card: ServiceCard, h: number) => {
    props.onCardHeightChange(card.id, h);
  }, [props.onCardHeightChange]);

  return (
    <>
      <NamespaceBackplate
        namespace={props.namespace}
        xywh={props.namespaceBBox.addMargin(sizes.endpointHPadding / 2)}
      />

      {props.placement.map(plc => (
        <EndpointCardBackplate
          key={plc.card.id}
          coords={plc.geometry}
          card={plc.card}
          onHeightChange={onCardHeightChange}
        />
      ))}

      <ArrowsRenderer
        arrows={props.arrows}
        accessPointsCoords={props.accessPointsCoords}
      />

      {props.placement.map(plc => {
        const accessPoints = props.accessPoints.get(plc.card.id);

        return (
          <EndpointCardContent
            active={props.isCardActive(plc.card.id)}
            key={plc.card.id}
            coords={plc.geometry}
            currentNamespace={props.namespace}
            card={plc.card}
            accessPoints={accessPoints}
            onHeightChange={onCardHeightChange}
            onClick={props.onCardSelect}
            onAccessPointCoords={props.onAccessPointCoords}
          />
        );
      })}
    </>
  );
});

export const Map = memo(function Map(props: Props) {
  const zoom = useMapZoom({
    wasDragged: props.wasDragged,
    onMapDrag: props.onMapDrag,
    mapBBox: useMapBBox(props.placement, props.namespaceBBox),
    visibleHeight: props.visibleHeight,
  });

  return (
    <svg ref={zoom.ref} className={css.wrapper}>
      <g transform={zoom.transform}>
        <MapElements {...props} />
      </g>
    </svg>
  );
});
