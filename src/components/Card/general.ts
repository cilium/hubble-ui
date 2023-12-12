import React from 'react';

import { XYWH, XY } from '~/domain/geometry';

export type SVGGElementRef = React.MutableRefObject<SVGGElement | null>;
export type DivRef = React.MutableRefObject<HTMLDivElement | null>;
export type CoordsFn = (points: XY) => [XY, XY];

export type CardProps<C> = {
  card: C;
  coords?: XYWH;
  children?: React.ReactNode;
  className?: string;
  isUnsizedMode?: boolean;
  divRef?: DivRef;
  underlayRef?: SVGGElementRef;
  backgroundsRef?: SVGGElementRef;
  overlayRef?: SVGGElementRef;

  onClick?: (c: C) => void;
  onHeaderClick?: (c: C) => void;
};
