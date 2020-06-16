import React, { FunctionComponent } from 'react';
import { KV } from '~/domain/misc';

import css from './styles.scss';

export interface Props {
  labels: Array<KV>;
}

export const EndpointCardLabels: FunctionComponent<Props> = props => {
  const labels = props.labels.map((l: KV) => {
    const pair = `${l.key}=${l.value}`;

    return (
      <div className={css.label} key={l.key}>
        {pair}
      </div>
    );
  });

  return <div className={css.labels}>{labels}</div>;
};
