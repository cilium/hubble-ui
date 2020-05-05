import React, { FunctionComponent } from 'react';
import { IPProtocol } from '~/domain/service-map';
import css from './styles.scss';

export interface Props {
  port: number;
  protocol: IPProtocol;
}

export const Component: FunctionComponent<Props> = props => {
  return (
    <div className={css.accessPoint}>
      <div className={css.icons}>
        <div className={css.circle}>
          <img src="/icons/misc/access-point.svg" />
        </div>

        <div className={css.arrow}>
          <img src="/icons/misc/ap-arrow-violet.svg" />
        </div>
      </div>

      <div className={css.data}>
        <div className={css.port}>{props.port}</div>
        <div className={css.dot} />
        <div className={css.protocol}>{IPProtocol[props.protocol]}</div>
      </div>
    </div>
  );
};

export const AccessPoint = React.memo(Component);
