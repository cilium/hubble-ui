import React, { FunctionComponent } from 'react';

import { AbstractCard } from '~/domain/cards';
import { XYWH, Vec2, XY } from '~/domain/geometry';
import { Connections, L7Endpoint } from '~/domain/interactions/new-connections';
import { Method as HttpMethod } from '~/domain/http';

export type RootRef = React.MutableRefObject<SVGGElement | null>;
export type DivRef = React.MutableRefObject<HTMLDivElement | null>;
export type CoordsFn = (points: XY) => [XY, XY];

export interface CardComponentProps<C extends AbstractCard> {
  card: C;
  coords: XYWH;
  currentNamespace?: string | null;
  active?: boolean;
  l7endpoints?: Connections<L7Endpoint>;
  isClusterMeshed?: boolean;
  maxHttpEndpointsVisible?: number;

  onHeightChange?: (height: number) => void;
  onAccessPointCoords?: (apId: string, coords: Vec2) => void;
  onHttpEndpointCoords?: (urlPath: string, m: HttpMethod, coords: XY) => void;
  onClick?: (card: C) => void;
}

export type CardComponent<C extends AbstractCard> = FunctionComponent<
  CardComponentProps<C>
>;

export interface BaseCardProps {
  coords: XYWH;
  isBackplate: boolean;
  active?: boolean;
  children?: React.ReactNode;
  // TODO: unused?
  // ref?: Ref<SVGGElement>;
  onHeightChange?: (h: number) => void;

  /* NOTE: coords function accepts coords of point relative to client space
     and returns tuple of two: coords in svg space and in card space */
  onEmitCoordsFn?: (fn: CoordsFn) => void;
  onClick?: () => void;
}
