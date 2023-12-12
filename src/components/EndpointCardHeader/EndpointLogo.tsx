import React, { FunctionComponent } from 'react';

import { ServiceCard } from '~/domain/service-map';

import { extractLogo } from './helpers';
import * as logos from './logos';

import css from './styles.scss';

export interface Props {
  card: ServiceCard;
}

export const EndpointLogo: FunctionComponent<Props> = ({ card }) => {
  const { id } = extractLogo(card);
  const url = (logos as any)[id] as string;

  return <div className={css.logo} style={{ backgroundImage: `url(${url})` }} />;
};
