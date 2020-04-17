import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { EndpointLogo } from '~/components/EndpointLogo';
import { useStore } from '~/store/hooks';
import { sizes } from '~/ui';
import { Endpoint } from '~/domain/endpoint';
import { XY } from '~/domain/geometry';

import css from './styles.scss';

export interface LayerProps {
  readonly endpoint: Endpoint;
}

export const EndpointCardHeader: FunctionComponent<LayerProps> = props => {
  const cls = classnames(css.wrapper);

  return (
    <div className={css.wrapper}>
      <div className={css.headline}>
        <div className={css.icon}>
          <EndpointLogo endpoint={props.endpoint} />
        </div>
        <div className={css.headings}>
          <div className={css.title}>{props.endpoint.caption}</div>
          <div className={css.subtitle}>{props.endpoint.id}</div>
        </div>
        {false && (
          <div className={css.settingsIcon}>
            <img src="/icons/misc/settings-gear.svg" />
          </div>
        )}
      </div>

      <PolicyInfo
        ingress={props.endpoint.ingressEnforcement}
        egress={props.endpoint.egressEnforcement}
      />
    </div>
  );
};

interface PolicyProps {
  ingress: boolean;
  egress: boolean;
}

const PolicyInfo: FunctionComponent<PolicyProps> = props => {
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
};
