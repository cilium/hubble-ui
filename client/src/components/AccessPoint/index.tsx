import React, {
  FunctionComponent,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';

import { ServiceCard } from '~/domain/service-card';
import { Link, IPProtocol } from '~/domain/service-map';
import { XY, Vec2 } from '~/domain/geometry';

import css from './styles.scss';

export interface Props {
  port: number;
  protocol: IPProtocol;
  id?: string | number;
  onConnectorPosEmit?: (pos: Vec2, apId: string) => void;
}

export const Component: FunctionComponent<Props> = props => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgCenter, setImgCenter] = useState<Vec2 | null>(null);

  const apId = useMemo(() => {
    return String(props.id ?? Date.now() + Math.random());
  }, [props.id]);

  const emitConnectorPosition = () => {
    if (
      props.onConnectorPosEmit == null ||
      imgRef.current == null ||
      imgCenter == null
    ) {
      return;
    }

    props.onConnectorPosEmit(imgCenter, apId);
  };

  const setupImageOnload = () => {
    if (imgRef.current == null) return;

    imgRef.current!.addEventListener('load', () => {
      const imgBox = imgRef.current!.getBoundingClientRect();

      const cx = imgBox.x + imgBox.width / 2;
      const cy = imgBox.y + imgBox.height / 2;

      setImgCenter(Vec2.from(cx, cy));
    });
  };

  useEffect(setupImageOnload, [imgRef]);
  useEffect(emitConnectorPosition, [imgCenter]);

  return (
    <div className={css.accessPoint} id={String(apId)}>
      <div className={css.icons}>
        <div className={css.circle}>
          <img src="/icons/misc/access-point.svg" ref={imgRef} />
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
