import classnames from 'classnames';
import React, { memo } from 'react';

import { EndpointLogo } from '~/components/EndpointLogo';
import { ServiceCard } from '~/domain/service-card';

import css from './styles.scss';

export interface LayerProps {
  card: ServiceCard;
}

export const EndpointCardHeader = memo(function EndpointCardHeader(
  props: LayerProps,
) {
  const card = props.card;

  return (
    <div className={css.wrapper}>
      <div className={css.headline}>
        <div className={css.icon}>
          <EndpointLogo card={card} />
        </div>
        <div className={css.headings}>
          <div className={css.title}>{card.caption}</div>
          {/* {card.isWorld && card.domain && (
            <div className={css.subtitle}>{card.domain}</div>
          )} */}
        </div>
        {false && (
          <div className={css.settingsIcon}>
            <img src="/icons/misc/settings-gear.svg" />
          </div>
        )}
      </div>

      <PolicyInfo
        ingress={card.service.ingressPolicyEnforced}
        egress={card.service.egressPolicyEnforced}
      />
    </div>
  );
});

interface PolicyProps {
  ingress: boolean;
  egress: boolean;
}

const PolicyInfo = memo(function PolicyProps(props: PolicyProps) {
  const inLocked = props.ingress ? 'locked' : 'unlocked';
  const eLocked = props.egress ? 'locked' : 'unlocked';

  const ingressIcon = `/icons/misc/ingress-${inLocked}.svg`;
  const egressIcon = `/icons/misc/ingress-${eLocked}.svg`;

  const ingressCls = classnames({
    [css.left]: true,
    [css.active]: props.ingress,
  });

  const egressCls = classnames({
    [css.right]: true,
    [css.active]: props.egress,
  });

  return (
    <div className={css.connectors}>
      <div className={ingressCls}>
        <img src={ingressIcon} />
        <span>Ingress</span>
      </div>

      <div className={egressCls}>
        <span>Egress</span>
        <img src={egressIcon} />
      </div>
    </div>
  );
});
