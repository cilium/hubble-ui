import React, { memo } from 'react';

import { EndpointCardBase } from './EndpointCardBase';
import { CardProps } from './general';

export const EndpointCardBackplate = memo(function EndpointCardBackplate(
  props: CardProps,
) {
  return <EndpointCardBase layer1 {...props} />;
});
