import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import { LayerProps } from './general';
import { EndpointCardLayer } from './EndpointCardBase';
import { EndpointCardLabels } from './EndpointCardLabels';
import { EndpointCardHeader } from '~/components/EndpointCardHeader';

export type Props = LayerProps & {
  onHeaderClick?: Function;
};

export const EndpointCardContent: FunctionComponent<Props> = props => {
  return (
    <EndpointCardLayer {...props}>
      <EndpointCardHeader card={props.card} onClick={props.onHeaderClick} />
      <EndpointCardLabels labels={props.card.labels} />
    </EndpointCardLayer>
  );
};
