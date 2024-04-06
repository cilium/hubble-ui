import React, { FunctionComponent } from 'react';
import { KV } from '~/domain/misc';

import css from './styles.scss';
import { Labels } from '~/domain/labels';

export interface Props {
  labels: Array<KV>;
}

export const EndpointCardLabels: FunctionComponent<Props> = props => {
  const labels = props.labels.map((label: KV) => {
    return (
      <div className={css.label} key={label.key}>
        {Labels.normalizeLabelToString(label)}
      </div>
    );
  });

  return <div className={css.labels}>{labels}</div>;
};
