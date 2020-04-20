import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import { LayerProps } from './general';
import { EndpointCardLayer } from './EndpointCardBase';

export const EndpointCardBackplate: FunctionComponent<LayerProps> = props => {
  return <EndpointCardLayer layer1 {...props} />;
};
