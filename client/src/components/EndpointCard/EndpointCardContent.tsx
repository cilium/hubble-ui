import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import { CardProps } from './general';
import { EndpointCardLayer } from './EndpointCardBase';
import { EndpointCardLabels } from './EndpointCardLabels';
import { EndpointCardHeader } from '~/components/EndpointCardHeader';
import { AccessPoint } from '~/components/AccessPoint';

import { ServiceCard } from '~/domain/service-card';
import { Link } from '~/domain/service-map';

import css from './styles.scss';

export type Props = CardProps & {
  onHeaderClick?: (card: ServiceCard) => void;
};

export const Component: FunctionComponent<Props> = props => {
  const accessPoints = props.card.links.map((l: Link) => {
    return (
      <AccessPoint
        key={l.id}
        port={l.destinationPort}
        protocol={l.ipProtocol}
      />
    );
  });

  return (
    <EndpointCardLayer {...props}>
      <EndpointCardHeader card={props.card} onClick={props.onHeaderClick} />

      {accessPoints.length > 0 && (
        <div className={css.accessPoints}>{accessPoints}</div>
      )}

      {props.active && <EndpointCardLabels labels={props.card.labels} />}
    </EndpointCardLayer>
  );
};

export const EndpointCardContent = React.memo(Component);
