import React, { FunctionComponent } from 'react';
import { ServiceCard } from '~/domain/service-card';
import { extractLogo } from './helpers';
import * as logos from './logos';

export interface Props {
  card: ServiceCard;
  size?: number;
}

export const EndpointLogo: FunctionComponent<Props> = ({ card, size }) => {
  const { id, type } = extractLogo(card);
  const imgSrc = (logos as any)[id] as string;

  return <img src={imgSrc} />;
};
