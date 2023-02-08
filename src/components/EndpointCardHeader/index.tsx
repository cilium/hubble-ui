import classnames from 'classnames';
import React, { memo } from 'react';

import { ServiceCard } from '~/domain/service-map';

import { EndpointLogo } from './EndpointLogo';

import css from './styles.scss';

export interface Props {
  card: ServiceCard;
  currentNamespace?: string | null;
}

export const EndpointCardHeader = memo(function EndpointCardHeader({
  card,
  currentNamespace,
}: Props) {
  const showSubtitle = !!card.namespace && card.namespace !== currentNamespace;

  const titleClassName = classnames(css.title, {
    [css.single]: !showSubtitle,
  });

  return (
    <div className={css.wrapper}>
      <div className={css.headline}>
        <EndpointLogo card={card} />
        <div className={css.headings}>
          <div className={titleClassName}>{card.caption}</div>
          {showSubtitle && <div className={css.subtitle}>{card.namespace}</div>}
        </div>
      </div>
      {/* <PolicyInfo
        ingress={card.service.ingressPolicyEnforced}
        egress={card.service.egressPolicyEnforced}
      /> */}
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

  const ingressIcon = `icons/misc/ingress-${inLocked}.svg`;
  const egressIcon = `icons/misc/ingress-${eLocked}.svg`;

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
