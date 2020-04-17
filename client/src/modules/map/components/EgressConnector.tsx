import * as React from 'react';
import ArrowRight from '~/icons/misc/arrow-right.svg';
import Lightning from '~/icons/misc/lightning.svg';
import css from './EgressConnector.scss';

export const EgressConnector = React.memo(() => {
  return (
    <div className={css.wrapper}>
      <ArrowRight />
      <Lightning />
    </div>
  );
});

EgressConnector.displayName = 'EgressConnector';
