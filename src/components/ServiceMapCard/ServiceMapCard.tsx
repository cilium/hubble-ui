import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AccessPoint, CenterGetter } from '~/components/AccessPoint';
import { EndpointCardHeader } from '~/components/EndpointCardHeader';

import { Vec2 } from '~/domain/geometry';
import {
  ServiceCard,
  AccessPoint as AccessPointDatum,
} from '~/domain/service-map';

import {
  Card,
  DivRef,
  BaseCardProps,
  CardComponentProps,
  CoordsFn,
} from '~/components/Card';
import { EndpointCardLabels } from './EndpointCardLabels';

import css from './styles.scss';

export type Props = CardComponentProps<ServiceCard>;

export const ServiceMapCard = memo(function ServiceMapCard(props: Props) {
  const [coordsFn, setCoordsFn] = useState<CoordsFn | null>(() => null);

  const centerGetters = useMemo((): Map<string, CenterGetter> => {
    return new Map();
  }, []);

  const onConnectorReady = useCallback((apId: string, cg: CenterGetter) => {
    centerGetters.set(apId, cg);
  }, []);

  const onEmitCoordsFn = useCallback((fn: CoordsFn) => {
    setCoordsFn(() => fn);
  }, []);

  const onClick = useCallback(() => {
    props.onClick?.(props.card);
  }, [props.onClick, props.card]);

  const emitConnectorCoords = useCallback(() => {
    if (props.onAccessPointCoords == null || coordsFn == null) return;

    centerGetters.forEach((cg: CenterGetter, apId: string) => {
      const connectorCenterCoords = cg();
      const [_, svgCoords] = coordsFn(connectorCenterCoords);

      props.onAccessPointCoords?.(apId, Vec2.fromXY(svgCoords));
    });
  }, [props.onAccessPointCoords, centerGetters, coordsFn]);

  // react to placement change
  useEffect(emitConnectorCoords, [
    props.coords,
    centerGetters,
    emitConnectorCoords,
    coordsFn,
  ]);

  const accessPoints = useMemo(() => {
    const aps = [...props.card.accessPoints.values()];

    return aps.map((ap: AccessPointDatum) => {
      return (
        <AccessPoint
          key={ap.id}
          id={ap.id}
          port={ap.port}
          protocol={ap.protocol}
          onConnectorReady={onConnectorReady}
        />
      );
    });
  }, [props.card, props.card.accessPoints, onConnectorReady]);

  // prettier-ignore
  const onHeightChange = useCallback((h: number) => {
    props.onHeightChange?.(h);

    // WARN: do not emit new connector coords from here cz
    // old coords will be received in props.coords hence wrong connector coords
    // will be emitted
  }, [emitConnectorCoords, props.onHeightChange]);

  return (
    <Card
      {...props}
      isBackplate={false}
      onHeightChange={onHeightChange}
      onClick={onClick}
      onEmitCoordsFn={onEmitCoordsFn}
    >
      <EndpointCardHeader
        card={props.card}
        currentNamespace={props.currentNamespace}
      />
      {accessPoints.length > 0 && (
        <div className={css.accessPoints}>{accessPoints}</div>
      )}
      {props.active && <EndpointCardLabels labels={props.card.labels} />}
    </Card>
  );
});
