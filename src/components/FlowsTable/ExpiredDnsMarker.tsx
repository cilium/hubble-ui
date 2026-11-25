import React, { memo } from 'react';
import { Icon } from '@blueprintjs/core';

import css from './styles.scss';

export const EXPIRED_DNS_HINT =
  'DNS record expired. This name comes from a connection that is still open, so it may be out of date.';

export const ExpiredDnsMarker = memo(function FlowsTableExpiredDnsMarker() {
  return (
    <span
      className={css.expiredDns}
      title={EXPIRED_DNS_HINT}
      aria-label={EXPIRED_DNS_HINT}
      role="img"
    >
      <Icon icon="time" size={11} />
    </span>
  );
});
