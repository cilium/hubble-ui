import React, { Ref } from 'react';

import { XYWH } from '~/domain/geometry';
import { ServiceCard, AccessPoint } from '~/domain/service-map';

export type RootRef = React.MutableRefObject<SVGGElement | null>;
export type DivRef = React.MutableRefObject<HTMLDivElement | null>;

export interface CardProps {
  card: ServiceCard;
  coords: XYWH;
  layer1?: boolean;
  active?: boolean;
  ref?: Ref<SVGGElement>;
  accessPoints?: Map<number, AccessPoint>;
  onHeightChange?: (card: ServiceCard, h: number) => void;
  onEmitRootRef?: (ref: RootRef) => void;
  onEmitContentRef?: (ref: DivRef) => void;
}
