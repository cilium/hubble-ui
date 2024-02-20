import React, { useLayoutEffect, useRef } from 'react';
import * as mobx from 'mobx';
import { observer } from 'mobx-react';

import * as e2e from '~e2e/client';

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
}

export const AccessPoint = observer(function AccessPoint(props: Props) {
  const connectorRef = useRef<HTMLDivElement>(null);

  const showPort = props.l4Protocol !== IPProtocol.ICMPv4 && props.l4Protocol !== IPProtocol.ICMPv6;

  const showL7Protocol = props.l7Protocol != null && props.l7Protocol !== L7Kind.Unknown;

  useLayoutEffect(() => {
    if (props.connectorRef == null || connectorRef.current == null) return;
    props.connectorRef.current = connectorRef.current;
  }, [props.connectorRef]);

  const e2eAttrs = mobx
    .computed(() => {
      return e2e.attributes.serviceMap.accessPoint(
        props.port,
        props.l4Protocol,
        props.l7Protocol,
        props.verdicts,
      );
    })
    .get();

  return (
    <div className={css.accessPoint} {...e2eAttrs}>
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
            <div className={css.port} {...e2e.attributes.serviceMap.portSelector()}>
              {props.port}
            </div>
            <div className={css.dot} />
          </>
        )}
        <div className={css.protocol} {...e2e.attributes.serviceMap.l4ProtoSelector()}>
          {IPProtocol[props.l4Protocol]}
        </div>

        {props.l7Protocol && showL7Protocol && (
          <>
            <div className={css.dot} />
            <div className={css.protocol} {...e2e.attributes.serviceMap.l7ProtoSelector()}>
              {l7helpers.l7KindToString(props.l7Protocol)}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
