import React, { FunctionComponent, ReactElement } from 'react';
import classnames from 'classnames';
import * as logos from './logos';

import { Endpoint } from '~/domain/endpoint';
import { extractLogo, LogoType } from './helpers';

export interface Props {
  endpoint: Endpoint;
  size?: number;
}

export const EndpointLogo: FunctionComponent<Props> = ({ endpoint, size }) => {
  const { id, type } = extractLogo(endpoint);
  const imgSrc = (logos as any)[id] as string;

  return <img src={imgSrc} />;
};
