import React, { FunctionComponent, useRef } from 'react';

import { XY } from '~/domain/geometry';
import { IPProtocol, L7Kind } from '~/domain/hubble';
import * as l7helpers from '~/domain/helpers/l7';

import { useElemCoords, useDiff } from '~/ui/hooks';
import { SingleIndicator } from '~/ui/hooks/useIndicator';
import css from './styles.scss';

export interface Props {
  port: number;
  l4Protocol: IPProtocol;
  l7Protocol?: L7Kind;

  indicator?: SingleIndicator;
  onConnectorCoords?: (_: XY) => void;
}

export const Component: FunctionComponent<Props> = props => {
  const imgContainer = useRef<HTMLDivElement>(null);

  const handle = useElemCoords(imgContainer, false, coords => {
    props.onConnectorCoords?.(coords.center);
  });

  useDiff(props.indicator?.value, () => {
    handle.emit();
  });

  return (
    <div className={css.accessPoint}>
      <div className={css.icons}>
        <div className={css.circle} ref={imgContainer}>
          <img src="/icons/misc/access-point.svg" />
        </div>

        <div className={css.arrow}>
          <img src="/icons/misc/ap-arrow-violet.svg" />
        </div>
      </div>

      <div className={css.data}>
        <div className={css.port}>{props.port}</div>
        <div className={css.dot} />
        <div className={css.protocol}>{IPProtocol[props.l4Protocol]}</div>

        {props.l7Protocol != null && props.l7Protocol !== L7Kind.Unknown && (
          <>
            <div className={css.dot} />
            <div className={css.protocol}>
              {l7helpers.l7KindToString(props.l7Protocol)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const AccessPoint = React.memo(Component);
