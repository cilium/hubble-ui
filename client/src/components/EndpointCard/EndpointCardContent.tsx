import React, {
  FunctionComponent,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  RefObject,
} from 'react';

import { CardProps, RootRef } from './general';
import { EndpointCardLayer } from './EndpointCardBase';
import { EndpointCardLabels } from './EndpointCardLabels';
import { EndpointCardHeader } from '~/components/EndpointCardHeader';
import { AccessPoint } from '~/components/AccessPoint';

import { Vec2 } from '~/domain/geometry';
import { ServiceCard } from '~/domain/service-card';
import { Link } from '~/domain/service-map';
import { ids } from '~/domain/ids';
import { Dictionary } from '~/domain/misc';

import css from './styles.scss';

export type Props = CardProps & {
  onHeaderClick?: (card: ServiceCard) => void;
  onEmitAPConnectorCoords?: (apId: string, coords: Vec2) => void;
};

export const Component: FunctionComponent<Props> = props => {
  const [rootRef, setRootRef] = useState<RootRef>(null as any);
  const [connCenters, setConnCenters] = useState<Dictionary<Vec2>>({});

  const onEmitRootRef = useCallback((rootRef: RootRef) => {
    setRootRef(rootRef);
  }, []);

  const onConnectorPosEmit = useCallback(
    (connCenter: Vec2, apId: string) => {
      setConnCenters({ ...connCenters, [apId]: connCenter });
    },
    [setConnCenters],
  );

  // XXX: don't know why, but simple callback is not working, rootRef is always
  // XXX: null, but this gives the same result as callback did
  useEffect(() => {
    if (
      props.onEmitAPConnectorCoords == null ||
      rootRef == null ||
      rootRef.current == null
    )
      return;

    const bbox = rootRef.current!.getBoundingClientRect();

    Object.keys(connCenters).forEach((apId: string) => {
      const connectorCenter = connCenters[apId];
      const relCoords = connectorCenter.sub(Vec2.fromXY(bbox));
      const factorCoords = Vec2.from(
        relCoords.x / bbox.width,
        relCoords.y / bbox.height,
      );

      const svgCoords = Vec2.from(
        factorCoords.x * props.coords.w,
        factorCoords.y * props.coords.h,
      ).add(Vec2.fromXY(props.coords));

      props.onEmitAPConnectorCoords!(apId, svgCoords);
    });
  }, [rootRef, connCenters]);

  const accessPoints = useMemo(() => {
    return props.card.links.map((l: Link) => {
      const id = ids.accessPoint(props.card.id, l.destinationPort);

      return (
        <AccessPoint
          key={id + l.sourceId}
          id={id}
          port={l.destinationPort}
          protocol={l.ipProtocol}
          onConnectorPosEmit={onConnectorPosEmit}
        />
      );
    });
  }, [props.card.links]);

  return (
    <EndpointCardLayer {...props} onEmitRootRef={onEmitRootRef}>
      <EndpointCardHeader card={props.card} onClick={props.onHeaderClick} />

      {accessPoints.length > 0 && (
        <div className={css.accessPoints}>{accessPoints}</div>
      )}

      {props.active && <EndpointCardLabels labels={props.card.labels} />}
    </EndpointCardLayer>
  );
};

Component.displayName = 'EndpointCardContent';
export const EndpointCardContent = React.memo(Component);
