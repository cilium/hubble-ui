import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import { CardProps } from './general';
import { EndpointCardLayer } from './EndpointCardBase';

export const Component: FunctionComponent<CardProps> = props => {
  return <EndpointCardLayer layer1 {...props} />;
};

export const EndpointCardBackplate = React.memo(Component);
