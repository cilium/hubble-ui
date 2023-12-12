import React, { useLayoutEffect, useRef } from 'react';
import { observer } from 'mobx-react';

import { XY } from '~/domain/geometry';
import { IPProtocol, L7Kind, Verdict } from '~/domain/hubble';
import * as l7helpers from '~/domain/helpers/l7';

import css from './styles.scss';

export interface Props {
  port: number;
  l4Protocol: IPProtocol;
  l7Protocol?: L7Kind;
  verdicts?: Set<Verdict>;
  connectorRef?: React.MutableRefObject<HTMLDivElement | null>;

  onConnectorCoords?: (_: XY) => void;
}

export const AccessPoint = observer(function AccessPoint(props: Props) {
  const connectorRef = useRef<HTMLDivElement>(null);

  const showPort = props.l4Protocol !== IPProtocol.ICMPv4 && props.l4Protocol !== IPProtocol.ICMPv6;

  const showL7Protocol = props.l7Protocol != null && props.l7Protocol !== L7Kind.Unknown;

  useLayoutEffect(() => {
    if (props.connectorRef == null || connectorRef.current == null) return;
    props.connectorRef.current = connectorRef.current;
  }, [props.connectorRef]);

  return (
    <div className={css.accessPoint}>
      <div className={css.icons}>
        <div className={css.circle} ref={connectorRef}>
          <img src="icons/misc/access-point.svg" />
        </div>

        <div className={css.arrow}>
          <img src="icons/misc/ap-arrow-violet.svg" />
        </div>
      </div>

      <div className={css.data}>
        {showPort && (
          <>
            <div className={css.port}>{props.port}</div>
            <div className={css.dot} />
          </>
        )}
        <div className={css.protocol}>{IPProtocol[props.l4Protocol]}</div>

        {props.l7Protocol && showL7Protocol && (
          <>
            <div className={css.dot} />
            <div className={css.protocol}>{l7helpers.l7KindToString(props.l7Protocol)}</div>
          </>
        )}
      </div>
    </div>
  );
});
