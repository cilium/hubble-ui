import * as React from 'react';
import { MapEndpoint } from '../entities';
import { EgressConnector } from './EgressConnector';
import css from './EndpointHeader.scss';

export interface Props {
  readonly endpoint: MapEndpoint;
}

export const EndpointHeader = React.memo<Props>(props => {
  return (
    <div className={css.wrapper}>
      <div className={css.icon}>A</div>
      <div className={css.headings}>
        <div className={css.title}>{props.endpoint.hash}</div>
        <div className={css.subtitle}>namespace</div>
      </div>
      <EgressConnector />
    </div>
  );
});

EndpointHeader.displayName = 'EndpointHeader';
