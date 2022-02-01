import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import * as mobx from 'mobx';

import { AccessPoint } from '~/components/AccessPoint';
import { EndpointCardHeader } from '~/components/EndpointCardHeader';

import { Vec2, XY } from '~/domain/geometry';
import { ServiceCard } from '~/domain/service-map';
import { ServiceEndpoint } from '~/domain/interactions/endpoints';
import { Method as HttpMethod } from '~/domain/http';

import { Card, CardComponentProps, CoordsFn } from '~/components/Card';
import { EndpointCardLabels } from './EndpointCardLabels';
import { HttpEndpoint } from './HttpEndpoint';
import { HTTPEndpointGroup } from './http-groups';

import css from './styles.scss';
import { useIndicator } from '~/ui/hooks';
import * as lang from '~/utils/lang';

export type Props = CardComponentProps<ServiceCard>;

export const ServiceMapCard = observer(function ServiceMapCard(props: Props) {
  const [coordsFn, setCoordsFn] = useState<CoordsFn | null>(() => null);
  const maxHttpEndpoints = props.maxHttpEndpointsVisible ?? Infinity;

  const onEmitCoordsFn = useCallback((fn: CoordsFn) => {
    setCoordsFn(() => fn);
  }, []);

  const onClick = useCallback(() => {
    props.onClick?.(props.card);
  }, [props.onClick, props.card]);

  const onAccessPointCoords = useCallback(
    (apId: string, coords: XY) => {
      if (coordsFn == null) return;

      const [_, svgCoords] = coordsFn(coords);
      props.onAccessPointCoords?.(apId, Vec2.fromXY(svgCoords));
    },
    [coordsFn, props.onAccessPointCoords],
  );

  const onHttpEndpointCoords = useCallback(
    (group: HTTPEndpointGroup, method: HttpMethod, coords: XY) => {
      if (coordsFn == null) return;

      const [_, svgCoords] = coordsFn(coords);
      props.onHttpEndpointCoords?.(group.url.pathname, method, svgCoords);
    },
    [coordsFn, props.onHttpEndpointCoords],
  );

  const indicator = useIndicator({
    portConnectors: 1,
    httpMethodConnectors: 1,
  });

  // react to placement change
  useEffect(() => {
    indicator.emit();
  }, [props.coords, coordsFn, props.active]);

  const accessPoints = mobx
    .computed(() => {
      const aps = [...props.card.accessPoints.values()];

      return aps.map((ap: ServiceEndpoint) => {
        const groups = HTTPEndpointGroup.createSorted(
          props.l7endpoints?.get(`${ap.port}`),
        );

        const endpointsWord = lang.pluralize(
          'endpoint',
          groups.length - maxHttpEndpoints,
        );

        return (
          <React.Fragment key={ap.id}>
            <AccessPoint
              key={ap.id}
              port={ap.port}
              l4Protocol={ap.l4Protocol}
              l7Protocol={ap.l7Protocol ?? void 0}
              indicator={indicator.narrow('portConnectors')}
              onConnectorCoords={xy => onAccessPointCoords(ap.id, xy)}
            />

            {groups.length > 0 && props.active && (
              <>
                <div className={css.l7groups}>
                  {groups.slice(0, maxHttpEndpoints).map(group => {
                    return (
                      <HttpEndpoint
                        key={group.key}
                        group={group}
                        indicator={indicator.narrow('httpMethodConnectors')}
                        onConnectorCoords={(method, xy) => {
                          onHttpEndpointCoords(group, method, xy);
                        }}
                      />
                    );
                  })}
                </div>
                {groups.length > maxHttpEndpoints && (
                  <div className={css.endpointsLimited}>
                    {endpointsWord.num} {endpointsWord.plural}{' '}
                    {endpointsWord.be} hidden
                  </div>
                )}
              </>
            )}
          </React.Fragment>
        );
      });
    })
    .get();

  // prettier-ignore
  const onHeightChange = useCallback((h: number) => {
    props.onHeightChange?.(h);

    // WARN: do not emit new connector coords from here cz
    // old coords will be received in props.coords hence wrong connector coords
    // will be emitted
  }, [props.onHeightChange]);

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
