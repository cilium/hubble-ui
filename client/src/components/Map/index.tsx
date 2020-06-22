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

import { useZoom } from '~/ui/hooks/useZoom';
import { sizes } from '~/ui/vars';

import { NamespaceBackplate } from './NamespaceBackplate';

import css from './styles.scss';

export interface Props {
  namespace: string | null;
  namespaceBBox: XYWH;
  placement: Placement;
  arrows: Map<string, SenderArrows>;
  isCardActive: (id: string) => boolean;
  accessPoints: AccessPoints;
  accessPointsCoords: Map<string, Vec2>;
  onCardSelect: (srvc: ServiceCard) => void;
  onEmitAccessPointCoords: (apId: string, coords: Vec2) => void;
  onCardHeightChange: (id: string, height: number) => void;
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
            card={plc.card}
            accessPoints={accessPoints}
            onHeightChange={onCardHeightChange}
            onClick={props.onCardSelect}
            onEmitAccessPointCoords={props.onEmitAccessPointCoords}
          />
        );
      })}
    </>
  );
});

export const Map = memo(function Map(props: Props) {
  const ref = React.useRef<SVGSVGElement>(null);
  const zoomProps = useZoom(ref, { tx: sizes.endpointHPadding });

  return (
    <svg ref={ref} className={css.wrapper}>
      <g transform={zoomProps ? zoomProps.toString() : ''}>
        <MapElements {...props} />
      </g>
    </svg>
  );
});
