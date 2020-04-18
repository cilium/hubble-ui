import React, { FunctionComponent, ReactElement } from 'react';
import classnames from 'classnames';
import * as logos from './logos';

import { ServiceCard } from '~/domain/service-card';
import { extractLogo, LogoType } from './helpers';

export interface Props {
  card: ServiceCard;
  size?: number;
}

export const EndpointLogo: FunctionComponent<Props> = ({ card, size }) => {
  const { id, type } = extractLogo(card);
  const imgSrc = (logos as any)[id] as string;

  return <img src={imgSrc} />;
};
