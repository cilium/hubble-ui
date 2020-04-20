import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import { CardProps } from './general';
import { EndpointCardLayer } from './EndpointCardBase';
import { EndpointCardLabels } from './EndpointCardLabels';
import { EndpointCardHeader } from '~/components/EndpointCardHeader';

import { ServiceCard } from '~/domain/service-card';

export type Props = CardProps & {
  onHeaderClick?: (card: ServiceCard) => void;
};

export const Component: FunctionComponent<Props> = props => {
  return (
    <EndpointCardLayer {...props}>
      <EndpointCardHeader card={props.card} onClick={props.onHeaderClick} />

      {props.active && <EndpointCardLabels labels={props.card.labels} />}
    </EndpointCardLayer>
  );
};

export const EndpointCardContent = React.memo(Component);
