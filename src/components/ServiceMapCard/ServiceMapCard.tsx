import React from 'react';
import { observer } from 'mobx-react';
import * as mobx from 'mobx';
import classnames from 'classnames';

import { Tooltip } from '@blueprintjs/core';

import { AccessPoint } from '~/components/AccessPoint';
import { EndpointCardHeader } from '~/components/EndpointCardHeader';
import { Card, CardProps } from '~/components/Card';
import { Teleport } from '~/components/Teleport';

import { ServiceCard } from '~/domain/service-map';
import { L7Endpoint, ServiceEndpoint } from '~/domain/interactions/endpoints';
import { Connections } from '~/domain/interactions/new-connections';

import { EndpointCardLabels } from './EndpointCardLabels';
import { HttpEndpoint } from './HttpEndpoint';
import { HTTPEndpointGroup } from './http-groups';

import { RefsCollector } from '~/ui/service-map/collector';
import * as lang from '~/utils/lang';
import css from './styles.scss';

// export type Props = CardComponentProps<ServiceCard>;
export type Props = CardProps<ServiceCard> & {
  collector: RefsCollector;
  l7endpoints?: Connections<L7Endpoint>;
  currentNamespace?: string | null;
  isClusterMeshed?: boolean;
  maxHttpEndpointsVisible?: number;
  active?: boolean;
  showAdditionalInfo?: boolean;
  onGotoProcessTree?: (card: ServiceCard) => void;
};

export const ServiceMapCard = observer(function ServiceMapCard(props: Props) {
  const maxHttpEndpoints = props.maxHttpEndpointsVisible ?? Infinity;

  const accessPoints = mobx
    .computed(() => {
      const aps = [...props.card.accessPoints.values()];

      return aps.map((ap: ServiceEndpoint) => {
        const groups = HTTPEndpointGroup.createSorted(props.l7endpoints?.get(`${ap.port}`));

        const endpointsWord = lang.pluralize('endpoint', groups.length - maxHttpEndpoints);

        return (
          <React.Fragment key={ap.id}>
            <AccessPoint
              key={ap.id}
              port={ap.port}
              l4Protocol={ap.l4Protocol}
              l7Protocol={ap.l7Protocol ?? void 0}
              connectorRef={props.collector.accessPointConnector(ap.id)}
            />

            {groups.length > 0 && props.active && (
              <>
                <div className={css.l7groups}>
                  {groups.slice(0, maxHttpEndpoints).map(group => {
                    return (
                      <HttpEndpoint key={group.key} group={group} collector={props.collector} />
                    );
                  })}
                </div>
                {groups.length > maxHttpEndpoints && (
                  <div className={css.endpointsLimited}>
                    {endpointsWord.num} {endpointsWord.plural} {endpointsWord.be} hidden
                  </div>
                )}
              </>
            )}
          </React.Fragment>
        );
      });
    })
    .get();

  const backplateClasses = classnames({
    [css.serviceMapCardBackplate]: true,
    [css.active]: !!props.active,
  });

  const backgroundClasses = classnames(css.serviceMapCardBackground);
  const foregroundClasses = classnames(css.serviceMapCardForeground);

  return (
    <>
      {/* Render backplate only when card sizes are known */}
      {!props.isUnsizedMode && (
        <>
          <Teleport to={props.underlayRef}>
            <Card coords={props.coords} card={props.card} className={backplateClasses} />
          </Teleport>

          <Teleport to={props.backgroundsRef}>
            <Card coords={props.coords} card={props.card} className={backgroundClasses} />
          </Teleport>
        </>
      )}

      <Card
        {...props}
        isUnsizedMode={!props.isUnsizedMode}
        className={foregroundClasses}
        divRef={props.collector.cardRoot(props.card.id)}
      >
        <EndpointCardHeader
          card={props.card}
          currentNamespace={props.currentNamespace}
          onHeadlineClick={() => props.onHeaderClick?.(props.card)}
        />

        {accessPoints.length > 0 && <div className={css.accessPoints}>{accessPoints}</div>}

        {props.isClusterMeshed && props.card.clusterName && (
          <div className={css.clusterNameLabel}>
            <Tooltip content={`Cluster name: ${props.card.clusterName}`}>
              {props.card.clusterName}
            </Tooltip>
          </div>
        )}

        {props.active && <EndpointCardLabels labels={props.card.labels} />}
      </Card>
    </>
  );
});
