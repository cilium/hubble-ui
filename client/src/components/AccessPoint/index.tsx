import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { Vec2 } from '~/domain/geometry';
import { IPProtocol } from '~/domain/hubble';

import css from './styles.scss';

export type CenterGetter = () => Vec2;

export interface Props {
  port: number;
  protocol: IPProtocol;
  id?: string | number;
  onConnectorReady?: (apId: string, centerGetter: CenterGetter) => void;
}

export const Component: FunctionComponent<Props> = props => {
  const imgContainer = useRef<HTMLDivElement>(null);

  const accessPointId = useMemo(() => {
    return String(props.id ?? Date.now() + Math.random());
  }, [props.id]);

  useEffect(() => {
    const container = imgContainer.current;
    if (!container) return;

    props.onConnectorReady?.(accessPointId, () => {
      const box = container.getBoundingClientRect();

      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      return Vec2.from(x, y);
    });
  }, [props.onConnectorReady, accessPointId, imgContainer.current]);

  return (
    <div className={css.accessPoint} id={String(accessPointId)}>
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
        <div className={css.protocol}>{IPProtocol[props.protocol]}</div>
      </div>
    </div>
  );
};

export const AccessPoint = React.memo(Component);
