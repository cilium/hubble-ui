import React, { Ref } from 'react';

import { ServiceCard } from '~/domain/service-card';
import { XY, XYWH } from '~/domain/geometry';
import { AccessPoint } from '~/domain/service-map';

export type RootRef = React.MutableRefObject<SVGGElement | null>;

export interface CardProps {
  card: ServiceCard;
  coords: XYWH;
  layer1?: boolean;
  active?: boolean;
  ref?: Ref<SVGGElement>;
  accessPoints?: Map<number, AccessPoint>;
  onHeightChange?: (card: ServiceCard, h: number) => void;
  onEmitRootRef?: (ref: RootRef) => void;
}
