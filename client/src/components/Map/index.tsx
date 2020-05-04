import React, { useCallback, useMemo, useState } from 'react';
import {
  EndpointCardBackplate,
  EndpointCardContent,
} from '~/components/EndpointCard';
import { dummy as geom } from '~/domain/geometry';
import { ServiceCard } from '~/domain/service-card';
import { Interactions, Link } from '~/domain/service-map';
import { useStore } from '~/store/hooks';
import { useZoom } from '~/ui/hooks/useZoom';
import { sizes } from '~/ui/vars';
import { NamespaceBackplate } from './NamespaceBackplate';
import css from './styles.scss';

export interface Props {
  services: Array<ServiceCard>;
  activeServices?: Set<string>;
  links?: Array<Link>;
  namespace: string | undefined;
  interactions?: Interactions;
  onServiceSelect?: (srvc: ServiceCard) => void;
}

export type MapElementsProps = Omit<Props, 'services'>;

export const MapElementsComponent = (props: MapElementsProps) => {
  const { layout } = useStore();
  const { namespace } = props;
  const [nsXYWH, setNsXYWH] = useState(geom.xywh());

  const placement = useMemo(() => layout.placement, [layout]);

  const updateNamespaceLayer = useCallback(() => {
    const nsBBox = layout.cardsBBox.addMargin(sizes.endpointHPadding / 2);
    setNsXYWH(nsBBox);
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

      {placement.map(plc => (
        <EndpointCardBackplate
          key={plc.serviceCard.id}
          coords={plc.geometry}
          card={plc.serviceCard}
          onHeightChange={updateNamespaceLayer}
        />
      ))}

      {placement.map(plc => (
        <EndpointCardContent
          active={isCardActive(plc.serviceCard)}
          key={plc.serviceCard.id}
          coords={plc.geometry}
          card={plc.serviceCard}
          onHeightChange={updateNamespaceLayer}
          onHeaderClick={props.onServiceSelect}
        />
      ))}
    </>
  );
};

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
        />
      </g>
    </svg>
  );
};

export const Map = React.memo(MapComponent);
